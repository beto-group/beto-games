"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


const { exec } = ({ exec: () => ({ on: () => { } }), spawn: () => ({ on: () => { }, stdout: { on: () => { } }, stderr: { on: () => { } }, unref: () => { } }), execSync: () => '' }) /* Stubbed for Web */;
const path = ({ join: (...a) => a.join('/'), resolve: (...a) => a.join('/'), isAbsolute: (p) => p?.startsWith('/'), dirname: (p) => p?.split('/').slice(0, -1).join('/') || '.', basename: (p) => p?.split('/').pop() || '' }) /* Stubbed for Web */;
const fs = ({ existsSync: () => false, readFileSync: () => '', writeFileSync: () => { }, statSync: () => ({ isDirectory: () => false }), readdirSync: () => [] }) /* Stubbed for Web */;

/**
 * Executes a shell command in the given directory.
 */
const runCommand = (cmd, cwd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd, env: { ...(typeof process !== "undefined" ? process.env : {}), TERM: 'xterm-256color' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[GitUtils] Command failed: ${cmd}`, stderr);
                reject({ error, stderr, stdout });
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

/**
 * Checks if a directory is a git repository.
 */
const isGitRepo = async (cwd) => {
    try {
        // Strictly check if this specific folder is a git root
        // We don't want to detect a parent repo (like the User's vault)
        return fs.existsSync(path.join(cwd, '.git'));
    } catch (e) {
        return false;
    }
};

/**
 * Initializes a git repo, commits files, and pushes to remote.
 */
const initializeAndPush = async (cwd, repoUrl, token, commitMessage = "Deploy from Datacore") => {
    const logs = [];
    const log = (msg) => logs.push(msg);

    try {
        // 1. Init
        if (!(await isGitRepo(cwd))) {
            log('Initializing git repository...');
            await runCommand('git init', cwd);
            await runCommand('git branch -M main', cwd);
        } else {
            log('Git repository already exists.');
            // Ensure we are on main branch or rename current to main
            try {
                await runCommand('git branch -M main', cwd);
            } catch (e) { /* ignore if no commits yet */ }
        }

        // 2. Configure User (Local only)
        log('Configuring local git user...');
        await runCommand('git config user.name "Datacore Bot"', cwd);
        await runCommand('git config user.email "bot@datacore.local"', cwd);

        // 3. Add Remote
        // Check if remote exists, if so remove it to be safe or update it
        try {
            const currentRemotes = await runCommand('git remote', cwd);
            if (currentRemotes.split('\n').map(r => r.trim()).includes('origin')) {
                await runCommand('git remote remove origin', cwd);
            }
        } catch (e) { /* ignore */ }

        // Construct URL with token for auth
        // Format: https://<token>@github.com/<user>/<repo>.git
        const authRepoUrl = repoUrl.replace('https://', `https://${token}@`);

        log('Adding remote origin...');
        await runCommand(`git remote add origin ${authRepoUrl}`, cwd);

        // 4. Add & Commit
        log('Adding files...');
        await runCommand('git add .', cwd);

        // Check if there are changes to commit
        const status = await runCommand('git status --porcelain', cwd);

        if (!status) {
            log('Nothing to commit, skipping.');
        } else {
            log(`Committing with message: "${commitMessage}"...`);
            await runCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, cwd);
        }

        // 5. Push
        log('Pushing to GitHub...');
        await runCommand('git push -u origin main --force', cwd);

        return { success: true, logs };
    } catch (e) {
        logs.push(`Error: ${e.stderr || e.error?.message || 'Unknown error'}`);
        return { success: false, logs };
    }
};

/**
 * Creates a GitHub repository via API.
 */
const createGitHubRepo = async (token, repoName, description = "Deployed via Datacore", isPrivate = true) => {
    try {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: repoName,
                description: description,
                private: isPrivate,
                auto_init: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();

            // Handle "Repo already exists" (422) explicitly to avoid console spam
            if (response.status === 422 && errorData.errors?.some(e => e.message === 'name already exists on this account')) {
                // Log a minimal INFO instead of a structured warning
                console.log(`[GitUtils] Repository "${repoName}" already exists. Skipping creation.`);
                // Return a success-like structure so the flow continues, or handle as needed
                // For now, we return existing url structure if possible or just null/success to proceed
                return { success: true, existed: true, html_url: `https://github.com/${(await getGitHubUser(token)).login}/${repoName}` };
            }

            // LOGGING FOR DEBUGGING
            console.warn('[GitUtils] GitHub API Error:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                errorData
            });

            let msg = errorData.message || 'Failed to create repository';

            // Append validation errors if any
            if (errorData.errors && Array.isArray(errorData.errors)) {
                const details = errorData.errors.map(e => `[${e.field || 'global'}: ${e.message}]`).join(', ');
                msg += ` | Details: ${details}`;
            }

            msg += ` (HTTP ${response.status})`;
            throw new Error(msg);
        }

        const data = await response.json();
        return { success: true, url: data.clone_url, html_url: data.html_url };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Deletes a GitHub repository via API.
 */
const deleteGitHubRepo = async (token, owner, repoName) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            // 204 No Content is success
            if (response.status === 204) return { success: true };
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete repository');
        }

        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Gets the authenticated user's details.
 */
const getGitHubUser = async (token) => {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) throw new Error('Failed to get user');
        return await response.json();
    } catch (e) {
    }
};

/**
 * Ensures .gitignore exists and includes .env and node_modules
 */
const ensureGitIgnore = async (cwd) => {
    const gitIgnorePath = path.join(cwd, '.gitignore');
    const defaultIgnores = ['.env', 'node_modules', '.DS_Store', '.next', 'out'];

    let content = '';
    if (fs.existsSync(gitIgnorePath)) {
        content = fs.readFileSync(gitIgnorePath, 'utf8');
    }

    let appended = false;
    const lines = content.split('\n').map(l => l.trim());

    defaultIgnores.forEach(item => {
        if (!lines.includes(item)) {
            content += `\n${item}`;
            appended = true;
        }
    });

    if (appended || !fs.existsSync(gitIgnorePath)) {
        fs.writeFileSync(gitIgnorePath, content.trim());
    }
};

/**
 * Parses .env file content into an object
 */
const parseEnv = (content) => {
    const res = {};
    content.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) {
            res[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, ''); // Simple unquote
        }
    });
    return res;
};

/**
 * Loads credentials from .env
 */
const loadEnv = (cwd) => {
    const envPath = path.join(cwd, '.env');
    if (fs.existsSync(envPath)) {
        return parseEnv(fs.readFileSync(envPath, 'utf8'));
    }
    return {};
};

/**
 * Saves credentials to .env
 */
const saveEnv = (cwd, newValues) => {
    const envPath = path.join(cwd, '.env');
    let currentEnv = {};

    if (fs.existsSync(envPath)) {
        currentEnv = parseEnv(fs.readFileSync(envPath, 'utf8'));
    }

    const merged = { ...currentEnv, ...newValues };
    const content = Object.entries(merged)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');

    fs.writeFileSync(envPath, content);

    // Also ensure gitignore is updated whenever we save potential secrets
    ensureGitIgnore(cwd);
};

/**
 * Initializes a local git repository without pushing.
 */
const initLocalRepo = async (cwd) => {
    const logs = [];
    const log = (msg) => logs.push(msg);

    try {
        if (await isGitRepo(cwd)) {
            log('Git repository already exists.');
            return { success: true, logs };
        }

        log('Initializing git repository...');
        await runCommand('git init', cwd);
        await runCommand('git branch -M main', cwd);

        log('Configuring local git user...');
        await runCommand('git config user.name "Datacore Bot"', cwd);
        await runCommand('git config user.email "bot@datacore.local"', cwd);

        // Ensure .gitignore exists
        await ensureGitIgnore(cwd);

        return { success: true, logs };
    } catch (e) {
        logs.push(`Error: ${e.stderr || e.error?.message || 'Unknown error'}`);
        return { success: false, logs };
    }
};

/**
 * Safely removes the .git folder in the given directory.
 */
const deleteLocalGit = async (cwd) => {
    const gitPath = path.join(cwd, '.git');
    try {
        if (fs.existsSync(gitPath)) {
            fs.rmSync(gitPath, { recursive: true, force: true });
            return { success: true };
        }
        return { success: true, message: 'No .git folder found.' };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Safely removes a folder (like .next) to ensure clean builds.
 */
const deleteFolder = async (cwd, folderName) => {
    const targetPath = path.join(cwd, folderName);
    try {
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
            return { success: true };
        }
        return { success: true, message: `Folder ${folderName} not found.` };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export {
    initializeAndPush,
    createGitHubRepo,
    deleteGitHubRepo,
    getGitHubUser,
    isGitRepo,
    ensureGitIgnore,
    loadEnv,
    saveEnv,
    initLocalRepo,
    deleteLocalGit,
    deleteFolder
};
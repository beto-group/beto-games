"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


// ─────────────────────────────────────────────────────────────
// 🚀 CORE: UNIVERSAL DEPLOYMENT & GITOPS ORCHESTRATOR
// ─────────────────────────────────────────────────────────────

const fs = ({ existsSync: () => false, readFileSync: () => '', writeFileSync: () => {}, statSync: () => ({ isDirectory: () => false }), readdirSync: () => [] }) /* Stubbed for Web */;
const path = ({ join: (...a) => a.join('/'), resolve: (...a) => a.join('/'), isAbsolute: (p) => p?.startsWith('/'), dirname: (p) => p?.split('/').slice(0,-1).join('/') || '.', basename: (p) => p?.split('/').pop() || '' }) /* Stubbed for Web */;
const { exec } = ({ exec: () => ({ on: () => {} }), spawn: () => ({ on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} }, unref: () => {} }), execSync: () => '' }) /* Stubbed for Web */;

function getDeploymentLogic(dc) {
    const rel = (p) => p.split('DATACORE/')[1] || p;

    const handleLocalDeploy = async ({ addLog, setStatus, setIsDeploying, folderPath }) => {
        setIsDeploying(true);
        setStatus("COMPILING...");
        addLog("DEPLOY_INIT");

        try {
            const vault = dc.app.vault;
            const adapter = vault.adapter;
            const vaultPath = adapter.getBasePath();

            // 1. Resolve Paths
            const componentPath = path.resolve(vaultPath, folderPath);
            const pluginPath = path.join(vaultPath, ".obsidian", "plugins", "dossier-os");
            const mainJsPath = path.join(pluginPath, "main.js");
            const manifestPath = path.join(pluginPath, "manifest.json");

            console.log("[Deployment] Paths Resolved:", { 
                component: rel(componentPath), 
                plugin: rel(pluginPath) 
            });

            // 2. Ensure Plugin Directory
            if (!fs.existsSync(pluginPath)) {
                fs.mkdirSync(pluginPath, { recursive: true });
                console.log("[Deployment] Created plugin directory.");
            }

            // 3. Manifest Synchronization
            const componentManifest = path.join(componentPath, "manifest.json");
            if (fs.existsSync(componentManifest)) {
                fs.copyFileSync(componentManifest, manifestPath);
                console.log("[Deployment] Manifest Synced.");
                addLog("MANIFEST_SYNCED");
            }

            // 4. Source Bundle Preparation
            // In Datacore context, we use the pre-built main.js if it exists, or the index.jsx
            const sourceMain = path.join(componentPath, "main.js");
            if (fs.existsSync(sourceMain)) {
                fs.copyFileSync(sourceMain, mainJsPath);
            } else {
                // Fallback to direct copy for simple deployments
                const srcPath = path.join(componentPath, "src", "index.jsx");
                if (fs.existsSync(srcPath)) {
                    fs.copyFileSync(srcPath, mainJsPath);
                }
            }

            console.log("[Deployment] Bundle Injected to Dossier OS.");
            addLog("BUNDLE_INJECTED");

            // 5. Trigger Obsidian Reload
            if (dc.app.plugins) {
                const pluginId = "dossier-os";
                await dc.app.plugins.disablePlugin(pluginId);
                await dc.app.plugins.enablePlugin(pluginId);
                console.log("[Deployment] Dossier OS Reinitialized");
                addLog("PLUGIN_RELOADED");
            }

            setStatus("IDLE");
            setIsDeploying(false);
            addLog("DEPLOY_SUCCESS");

        } catch (e) {
            console.error("[Deployment] Local deploy FAILED:", e);
            setStatus("DEPLOY_ERROR");
            setIsDeploying(false);
            addLog("DEPLOY_CRASH");
        }
    };

    const handlePublish = async ({ repoName, ghToken, addLog, setStatus, setIsPublishing, folderPath }) => {
        setIsPublishing(true);
        setStatus("PREPARING_GITOPS...");
        addLog("PUBLISH_INIT");

        // 🛡️ AUTH HANDSHAKE: Priority Shift (Manual UI -> Native Keychain)
        let activeToken = ghToken;
        let authSource = "UI_MANUAL";

        if (!activeToken) {
            console.log("[Deployment] Manual token empty, attempting NATIVE_GRAB...");
            try {
                const { execSync } = ({ exec: () => ({ on: () => {} }), spawn: () => ({ on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} }, unref: () => {} }), execSync: () => '' }) /* Stubbed for Web */;
                const cmd = `security find-generic-password -s "gh:github.com" -w || security find-generic-password -s "github.com" -w || security find-generic-password -s "GitHub" -w`;
                let raw = execSync(cmd, { encoding: 'utf8' }).replace(/[\r\n]/g, '').trim();
                
                if (raw) {
                    if (raw.startsWith('go-keyring-base64:')) {
                        const b64 = raw.split(':')[1].trim();
                        activeToken = (typeof Buffer !== 'undefined')
                            ? Buffer.from(b64, 'base64').toString('utf8').trim()
                            : decodeURIComponent(escape(window.atob(b64))).trim();
                    } else {
                        activeToken = raw;
                    }
                    if (activeToken) {
                        authSource = "NATIVE_KEYCHAIN";
                        addLog("NATIVE_GRAB_SUCCESS");
                    }
                }
            } catch (e) { /* Expected */ }
        }

        if (!activeToken || !repoName) {
            console.error("[Deployment] AUTH_BLOCK: No token or repo defined.");
            setStatus("CONFIG_REQUIRED"); 
            setIsPublishing(false);
            return; 
        }

        console.log(`[Deployment] Starting Public Publish for: ${folderPath}`);
        try {
            const vaultPath = dc.app.vault.adapter.getBasePath();
            const componentPath = path.resolve(vaultPath, folderPath);
            const manifestPath = path.join(componentPath, "manifest.json");
            const req = window.requestUrl || dc.app.requestUrl;

            // 🛠️ ROBUST PATH LOGGING
            const getRel = (p) => path.relative(vaultPath, p);

            console.log("[Deployment] Paths Resolved (Relative):", { 
                component: getRel(componentPath), 
                manifest: getRel(manifestPath) 
            });

            // 0. Alpha-Bump & Native Transpilation (esbuild)
            let pushVersion = "1.0.0";
            const distPath = path.join(componentPath, "main.js");
            const nativeEntry = path.join(componentPath, "src", "native", "main.tsx");

            console.log("[Deployment] Orchestrating Native Build (esbuild)...");
            if (fs.existsSync(nativeEntry)) {
                try {
                    const { execSync } = ({ exec: () => ({ on: () => {} }), spawn: () => ({ on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} }, unref: () => {} }), execSync: () => '' }) /* Stubbed for Web */;
                    // Use Login Shell to ensure npx/node are in PATH
                    const buildCmd = `/bin/zsh -l -c "npx esbuild ${path.join(componentPath, 'src', 'native', 'main.tsx')} --bundle --outfile=${distPath} --minify --platform=node --external:obsidian --external:electron --external:react --external:react-dom --external:react/jsx-runtime --external:\\\"react-dom/*\\\" --define:(typeof process !== "undefined" ? process.env : {}).NODE_ENV=\\\"'production'\\\" --target=es2020 --format=cjs --jsx=transform --loader:.jsx=jsx"`;
                    console.log("[Deployment] Running Build Command...");
                    execSync(buildCmd, { cwd: componentPath });
                    
                    if (fs.existsSync(distPath)) {
                        console.log("[Deployment] ESBUILD_SUCCESS: Native bundle generated.");
                        addLog("AUTO_BUNDLING_SUCCESS");
                    }
                    console.log("[Deployment] PATH_SYNC_SUCCESS: Native entry identified.");
                } catch (e) {
                    console.error("[Deployment] ESBUILD_FAILED:", e.message);
                    addLog("AUTO_BUNDLING_FAILED");
                    // ⛔ DO NOT fallback to raw JSX copy (it causes SyntaxErrors in native)
                }
            } else {
                console.error("[Deployment] NATIVE_ENTRY_MISSING: main.tsx not found in src/native.");
                addLog("NATIVE_ENTRY_MISSING");
            }

            if (fs.existsSync(manifestPath)) {
                try {
                    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    const parts = m.version.split('.');
                    parts[2] = parseInt(parts[2] || 0) + 1;
                    pushVersion = parts.join('.');
                    m.version = pushVersion;
                    fs.writeFileSync(manifestPath, JSON.stringify(m, null, '\t'));
                    addLog(`PUBLISH_BUMP_V${pushVersion}`);
                    console.log(`[Deployment] Publish Version bump: v${pushVersion}`);
                } catch (e) {
                    console.error("[Deployment] Publish version bump error:", e);
                }
            }

            // 1. GitHub User Discovery
            console.log("[Deployment] Requesting GitHub authentication...");
            const userRes = await req({
                url: 'https://api.github.com/user',
                method: 'GET',
                headers: { 
                    'Authorization': `token ${activeToken}`, 
                    'Accept': 'application/vnd.github.v3+json' 
                }
            });
            
            if (userRes.status !== 200) {
                console.error("[Deployment] Auth FAILED (Status:", userRes.status, ")");
                console.error("[Deployment] Auth Error Details:", userRes.json || userRes.text);
                throw new Error(`AUTH_FAILED_${userRes.status}`);
            }
            const { login } = userRes.json;
            console.log(`[Deployment] Authenticated as: ${login}`);
            
            // 2. Repository Existence Check & Auto-Provisioning
            console.log(`[Deployment] Verifying repository: ${login}/${repoName}`);
            let needsCreation = false;
            try {
                const repoCheckRes = await req({
                    url: `https://api.github.com/repos/${login}/${repoName}`,
                    method: 'GET',
                    headers: { 
                        'Authorization': `token ${activeToken}`, 
                        'Accept': 'application/vnd.github.v3+json' 
                    }
                });
                if (repoCheckRes.status === 404) needsCreation = true;
                else if (repoCheckRes.status !== 200) {
                    console.warn("[Deployment] Repo check warning (Status:", repoCheckRes.status, ")");
                }
            } catch (e) {
                // Handle cases where requestUrl throws on 404
                if (e.message?.includes("404") || e.status === 404) {
                    console.log("[Deployment] 404 Signal Caught (Repo Missing)");
                    needsCreation = true;
                } else {
                    console.error("[Deployment] Repo check CRASH:", e);
                    throw e;
                }
            }

            if (needsCreation) {
                console.log(`[Deployment] Repo missing. Auto-provisioning: ${repoName}...`);
                addLog("PROVISIONING_REPO");
                const createRepoRes = await req({
                    url: 'https://api.github.com/user/repos',
                    method: 'POST',
                    headers: { 
                        'Authorization': `token ${activeToken}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        name: repoName,
                        description: "Cinematic Dossier OS // Generated by Ultimate Resume Builder.",
                        private: false,
                        has_issues: true,
                        has_projects: false,
                        has_wiki: false
                    })
                });

                if (createRepoRes.status !== 201) {
                    console.error("[Deployment] Repo creation FAILED:", createRepoRes.json);
                    throw new Error("PROVISIONING_FAILED");
                }
                console.log("[Deployment] Repository Created successfully.");
                addLog("PROVISION_SUCCESS");
            }

            const authedUrl = `https://${activeToken}@github.com/${login}/${repoName}.git`;
            const tag = `v${pushVersion}`;

            // 3. Git Pipeline
            const cmd = `
                git init && 
                git checkout -b main || git checkout main &&
                git remote add origin ${authedUrl} || git remote set-url origin ${authedUrl} && 
                git add -A && 
                git commit -m "Dossier Update [v${pushVersion}]" && 
                git tag v${pushVersion} &&
                git push -u origin main --force &&
                git push origin --tags
            `;

            console.log("[Deployment] Executing Git Push...");
            setStatus("GITOPS_PUSHING...");
            addLog("GIT_START");

            const child = exec(cmd, { cwd: componentPath });
            child.stdout.on('data', (d) => console.log("[Deployment] [STDOUT]", d));
            child.stderr.on('data', (d) => console.warn("[Deployment] [STDERR]", d));

            child.on('close', async (code) => {
                if (code === 0) {
                    console.log("[Deployment] Git Push SUCCESS");
                    addLog("GIT_SUCCESS");
                    
                    // 4. Trigger Release Creation & Asset Upload (Native Grab Protocol)
                    try {
                        const tag = `v${pushVersion}`;
                        console.log(`[Deployment] Syncing Release Assets for ${tag}...`);
                        
                        // Check for Existing Release (Non-throwing)
                        const checkRes = await req({
                            url: `https://api.github.com/repos/${login}/${repoName}/releases/tags/${tag}?t=${Date.now()}`,
                            headers: { 
                                'Authorization': `token ${activeToken}`, 
                                'Accept': 'application/vnd.github.v3+json',
                                'Cache-Control': 'no-cache'
                            },
                            throw: false
                        });

                        let release;
                        if (checkRes.status === 200) {
                            release = checkRes.json;
                            console.log("[Deployment] Existing release found. Updating assets...");
                        } else {
                            // Create New Release (Non-throwing)
                            console.log("[Deployment] Creating new release...");
                            const createRes = await req({
                                url: `https://api.github.com/repos/${login}/${repoName}/releases`,
                                method: 'POST',
                                headers: { 
                                    'Authorization': `token ${activeToken}`, 
                                    'Content-Type': 'application/json' 
                                },
                                body: JSON.stringify({ 
                                    tag_name: tag, 
                                    name: `Resume Dossier ${tag}`, 
                                    body: "Automated Resilient Release (Native Grab).", 
                                    draft: false 
                                }),
                                throw: false
                            });
                            release = createRes.json;
                        }

                        if (!release || !release.upload_url) throw new Error("Could not find release target.");
                        const uploadUrl = release.upload_url.split('{')[0];

                        // Purge Stale Assets
                        if (release.assets && release.assets.length > 0) {
                            const targets = ['main.js', 'manifest.json', 'styles.css'];
                            for (const asset of release.assets) {
                                if (targets.includes(asset.name)) {
                                    console.log(`[Deployment] Purging stale asset: ${asset.name}`);
                                    try {
                                        await req({
                                            url: `https://api.github.com/repos/${login}/${repoName}/releases/assets/${asset.id}`,
                                            method: 'DELETE',
                                            headers: { 'Authorization': `token ${activeToken}` }
                                        });
                                    } catch (e) { /* Skip */ }
                                }
                            }
                        }

                        // Upload Binary Assets
                        const assets = [
                            { name: 'main.js', path: path.join(componentPath, 'main.js') },
                            { name: 'manifest.json', path: path.join(componentPath, 'manifest.json') }
                        ];

                        for (const asset of assets) {
                            if (fs.existsSync(asset.path)) {
                                console.log(`[Deployment] Uploading binary asset: ${asset.name}`);
                                addLog(`UPLOAD_${asset.name.toUpperCase()}`);
                                
                                const fileData = fs.readFileSync(asset.path);
                                const uploadRes = await req({
                                    url: `${uploadUrl}?name=${asset.name}`,
                                    method: 'POST',
                                    headers: { 
                                        'Authorization': `token ${activeToken}`, 
                                        'Content-Type': 'application/octet-stream' 
                                    },
                                    body: new Uint8Array(fileData).buffer
                                });
                                
                                if (uploadRes.status === 201) {
                                    console.log(`[Deployment] Asset ${asset.name} uploaded successfully.`);
                                }
                            }
                        }
                        
                        addLog("RELEASE_READY");
                    } catch (e) {
                        console.error("[Deployment] Release Asset Sync FAILED:", e);
                        addLog("RELEASE_SYNC_FAILED");
                    }

                    setStatus("IDLE");
                    setIsPublishing(false);
                    addLog("PUBLISH_COMPLETE");
                } else {
                    console.error("[Deployment] Git FAILED (Exit Code:", code, ")");
                    setStatus("GIT_ERROR");
                    setIsPublishing(false);
                    addLog("GIT_FAILURE");
                }
            });

        } catch (e) {
            console.error("[Deployment] Public sync EXCEPTION:", e);
            setStatus("SYNC_ERROR");
            setIsPublishing(false);
            addLog("PUBLISH_CRASH");
        }
    };

    const handleWebPublish = async ({ addLog, setStatus, setIsPublishing, folderPath, envConfig }) => {
        setIsPublishing(true);
        setStatus("WEB_SYNC_INIT...");
        addLog("WEB_PUBLISH_START");

        try {
            const vaultPath = dc.app.vault.adapter.getBasePath();
            const componentPath = path.resolve(vaultPath, folderPath);
            const websitePath = path.resolve(vaultPath, "_RESOURCES/DATACORE/76 NextWebsite");
            const targetPath = path.join(websitePath, "src/datacore/UltimateResumeBuilder");

            console.log("[Deployment] [WEB] Paths Resolved:", { 
                source: rel(componentPath), 
                target: rel(targetPath) 
            });

            if (!fs.existsSync(websitePath)) {
                console.error("[Deployment] [WEB] Website project not found at:", websitePath);
                throw new Error("WEBSITE_PROJECT_MISSING");
            }

            // 0. Environment Orchestration (Auto-generate .env)
            if (envConfig) {
                setStatus("SYNCING_ENVIRONMENT...");
                addLog("ENV_SYNC_START");
                const envPath = path.join(websitePath, ".env");
                let envContent = "";
                for (const [key, val] of Object.entries(envConfig)) {
                    if (val) envContent += `${key}=${val}\n`;
                }
                fs.writeFileSync(envPath, envContent);
                console.log("[Deployment] [WEB] .env file synchronized.");
                addLog("ENV_SYNC_SUCCESS");
            }

            // 1. Source Mirroring (Sync src folder)
            const { execSync } = ({ exec: () => ({ on: () => {} }), spawn: () => ({ on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} }, unref: () => {} }), execSync: () => '' }) /* Stubbed for Web */;
            addLog("SYNCING_SOURCE");
            if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
            
            // Clean & Copy
            execSync(`rm -rf "${targetPath}" && cp -R "${path.join(componentPath, 'src')}" "${targetPath}"`);
            console.log("[Deployment] [WEB] Source mirrored to website.");

            // 2. Trigger Website Shim & Patch (Transpilation Bridge)
            setStatus("BUILDING_WEB_SHIM...");
            addLog("SHIM_START");
            execSync(`/bin/zsh -l -c "npm run shim && npm run patch"`, { cwd: websitePath });
            console.log("[Deployment] [WEB] Website shim & patch completed.");

            // 3. Git Ops for Web Repo
            setStatus("GITOPS_PUSH_WEB...");
            addLog("WEB_GIT_START");
            const gitCmd = `
                git add -A && 
                git commit -m "Dossier Sync: UltimateResumeBuilder Update [Auto-Generated]" && 
                git push origin main
            `;
            execSync(gitCmd, { cwd: websitePath });
            console.log("[Deployment] [WEB] Git Push SUCCESS");

            setStatus("IDLE");
            setIsPublishing(false);
            addLog("WEB_PUBLISH_SUCCESS");

        } catch (e) {
            console.error("[Deployment] Web Publish FAILED:", e);
            setStatus("WEB_PUBLISH_ERROR");
            setIsPublishing(false);
            addLog("WEB_PUBLISH_CRASH");
        }
    };

    return { handleLocalDeploy, handlePublish, handleWebPublish };
}

const _exports = { getDeploymentLogic };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

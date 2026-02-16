"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


// Hooks provided by React import
const { exec, spawn } = ({ exec: () => ({ on: () => {} }), spawn: () => ({ on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} }, unref: () => {} }), execSync: () => '' }) /* Stubbed for Web */;
const path = ({ join: (...a) => a.join('/'), resolve: (...a) => a.join('/'), isAbsolute: (p) => p?.startsWith('/'), dirname: (p) => p?.split('/').slice(0,-1).join('/') || '.', basename: (p) => p?.split('/').pop() || '' }) /* Stubbed for Web */;
const fs = ({ existsSync: () => false, readFileSync: () => '', writeFileSync: () => {}, statSync: () => ({ isDirectory: () => false }), readdirSync: () => [] }) /* Stubbed for Web */;

function ControlPanel({ folderPath, isFullTab, onToggleFullTab, DeploymentManager, gitUtils, cfUtils }) {
    const [serverUrl, setServerUrl] = useState('http://localhost:3000');
    const [status, setStatus] = useState('Idle');
    const [action, setAction] = useState('start_dev'); // Default to Dev Mode
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [deployStatus, setDeployStatus] = useState('idle'); // idle, building, success, failure

    // Helper to log status
    const log = (msg) => setStatus(msg);

    const checkServer = async (silent = false) => {
        if (!silent) setStatus('Checking server...');
        try {
            // mode: 'no-cors' causes an opaque response, which is fine for availability check
            // BUT strict CSP might still block the connection entirely (ERR_ABORTED).
            // We catch and ignore to prevent console spam if silent.
            await fetch(serverUrl, { method: 'HEAD', mode: 'no-cors' });
            if (!silent) setStatus('Server appears running.');
            return true;
        } catch (e) {
            if (!silent) setStatus('Server check failed (CSP or Offline).');
            return false;
        }
    };

    useEffect(() => {
        // Initial silent check
        checkServer(true);
    }, []);

    const openUrl = (url) => {
        try {
            // Try to open in system default browser (safer, avoids Electron remote errors)
            if (typeof require !== 'undefined') {
                ({ shell: { openExternal: (url) => typeof window !== 'undefined' && window.open(url, '_blank') } }) /* Stubbed for Web */.shell.openExternal(url);
            } else {
                window.open(url, '_blank');
            }
        } catch (e) {
            console.error("Failed to open URL externaly, falling back:", e);
            window.open(url, '_blank');
        }
    };

    const handleExecute = async (explicitAction) => {
        // If explicitAction is an Event (object), treat it as null so we use 'action' state
        const activeAction = (typeof explicitAction === 'string' ? explicitAction : null) || action;

        if (activeAction === 'open') {
            log(`Opening Internal: ${serverUrl}...`);
            window.open(serverUrl);
        } else if (activeAction === 'force_external') {
            log(`Opening Externally: ${serverUrl}`);
            openUrl(serverUrl);
        } else if (activeAction === 'embed') {
            log("Embedding in view...");
            // logic handled in render
        } else if (activeAction === 'build' || activeAction === 'build_open' || activeAction === 'clean' || activeAction === 'start_dev') {
            // Use spawn with login shell to ensure PATH is loaded correctly (like DatacoreTerminal)

            // Resolve absolute path for CWD
            let absolutePath = folderPath;
            if (!path.isAbsolute(folderPath)) {
                // Assuming folderPath is relative to Vault root
                const vaultPath = dc.app.vault.adapter.getBasePath();
                absolutePath = path.resolve(vaultPath, folderPath);
            }

            let cmd = activeAction === 'clean' ? 'npm run clean' : 'npm run build';

            if (activeAction === 'clean') {
                log("Stopping services before cleanup...");
                // Force kill any running dev server to release file locks
                try {
                    const port = 3000;
                    const killCmd = `lsof -ti:${port} | xargs kill -9`;
                    await new Promise(resolve => exec(killCmd, resolve));
                } catch (e) { /* ignore */ }
            }

            if (activeAction !== 'clean') {
                const nodeModulesPath = path.join(absolutePath, 'node_modules');
                if (!fs.existsSync(nodeModulesPath)) {
                    log("Dependencies missing. Installing...");
                    console.log("[ControlPanel] node_modules missing. Prepending 'npm install'.");
                    cmd = 'npm install && ' + cmd;
                }
            }

            log(`Running... (${cmd})`);
            console.log(`[ControlPanel] Running in: ${absolutePath}`);

            // Fetch secrets from Keychain for injection
            const storage = dc.app.secretStorage;
            let secrets = {};
            if (storage && typeof storage.getSecret === 'function') {
                secrets = {
                    GITHUB_TOKEN: await storage.getSecret('dc-github-token'),
                    CF_API_TOKEN: await storage.getSecret('dc-cf-token'),
                    CF_ACCOUNT_ID: await storage.getSecret('dc-cf-account-id'),
                    // REPO_NAME and CF_PROJECT_NAME are usually non-sensitive or passed via config
                };
            }

            const shell = '/bin/zsh';
            const args = ['-l', '-c', cmd]; // -l loads user profile (nvm etc)

            const child = spawn(shell, args, {
                cwd: absolutePath,
                env: {
                    ...(typeof process !== "undefined" ? process.env : {}),
                    ...secrets,
                    TERM: 'xterm-256color'
                },
                detached: true
            });

            let output = '';
            let logBuffer = '';

            const processChunk = (data) => {
                const str = data.toString();
                output += str;
                logBuffer += str;
            };

            child.stdout.on('data', processChunk);
            child.stderr.on('data', processChunk);

            // Throttle updates to UI and Console to prevent freezing
            const updateInterval = setInterval(() => {
                if (logBuffer) {
                    // console.log(logBuffer); // Pending logs (Silenced per user request)
                    const lines = logBuffer.trim().split('\n');
                    if (lines.length > 0) {
                        const lastLine = lines[lines.length - 1];
                        setStatus(`Running: ${lastLine.substring(0, 30)}...`);
                    }
                    logBuffer = '';
                }
            }, 500);

            child.on('error', (err) => {
                clearInterval(updateInterval);
                log(`Build Failed to Start: ${err.message}`);
            });

            const startServer = (cwd) => {
                const shell = '/bin/zsh';
                const args = ['-l', '-c', 'npm run start'];
                const child = spawn(shell, args, {
                    cwd,
                    env: { ...(typeof process !== "undefined" ? process.env : {}), TERM: 'xterm-256color' },
                    detached: true,
                    stdio: 'ignore'
                });
                child.unref();
            };

            const waitForServer = async () => {
                for (let i = 0; i < 60; i++) {
                    const isUp = await checkServer(true);
                    if (isUp) return true;
                    setStatus(`Waiting for server... ${i + 1}s`);
                    await new Promise(r => setTimeout(r, 1000));
                }
                return false;
            };

            const startDevMode = async (cwd) => {
                log("Ensuring port is free...");
                const url = new URL(serverUrl);
                const port = url.port || (url.protocol === 'https:' ? '443' : '3000');

                // Kill existing process if any
                await new Promise(r => {
                    exec(`lsof -ti:${port} | xargs kill -9`, () => r());
                });

                log("Starting Dev Server...");
                console.log(`[ControlPanel] Spawning npm run dev on port ${port}...`);

                // Fetch secrets from Keychain for injection
                const storage = dc.app.secretStorage;
                let secrets = {};
                if (storage && typeof storage.getSecret === 'function') {
                    secrets = {
                        GITHUB_TOKEN: await storage.getSecret('dc-github-token'),
                        CF_API_TOKEN: await storage.getSecret('dc-cf-token'),
                        CF_ACCOUNT_ID: await storage.getSecret('dc-cf-account-id'),
                    };
                }

                const shell = '/bin/zsh';
                // Explicitly specify port to match serverUrl
                let devCmd = `npm run dev -- --port ${port}`;

                // Check for node_modules
                const nodeModulesPath = path.join(cwd, 'node_modules');
                if (!fs.existsSync(nodeModulesPath)) {
                    log("Dependencies missing. Installing...");
                    console.log("[ControlPanel] node_modules missing. Prepending 'npm install'.");
                    devCmd = `npm install && npm run dev -- --port ${port}`;
                }

                console.log(`[ControlPanel] Running: ${devCmd}`);

                const args = ['-l', '-c', devCmd];
                const child = spawn(shell, args, {
                    cwd,
                    env: {
                        ...(typeof process !== "undefined" ? process.env : {}),
                        ...secrets,
                        TERM: 'xterm-256color'
                    },
                    detached: true
                    // Removed stdio: 'ignore' to capture output for debugging
                });

                // Log output for debugging
                child.stdout?.on('data', (data) => {
                    console.log(`[DevServer] ${data.toString().trim()}`);
                });
                child.stderr?.on('data', (data) => {
                    console.warn(`[DevServer] ${data.toString().trim()}`);
                });
                child.on('error', (err) => {
                    console.error(`[DevServer] Spawn error: ${err.message}`);
                    log(`Dev Server Error: ${err.message}`);
                });
                child.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`[DevServer] Exited with code ${code}`);
                        log(`Dev Server exited (${code})`);
                    }
                });

                child.unref();

                waitForServer().then(ready => {
                    if (ready) {
                        log("Dev Server Ready! Opening Internal...");
                        window.open(serverUrl);
                    } else {
                        log("Dev Server timed out. Check console for errors.");
                    }
                });
            };

            if (activeAction === 'start_dev') {
                startDevMode(absolutePath);
                return;
            }

            child.on('close', async (code) => {
                clearInterval(updateInterval);
                // Flush remaining logs
                if (logBuffer) console.log(logBuffer);

                if (code !== 0) {
                    log(`${activeAction === 'clean' ? 'Clean' : 'Build'} Failed (Exit Code ${code})`);
                    console.error(output); // Dump full log on error
                } else {
                    log(`${activeAction === 'clean' ? 'Clean' : 'Build'} Complete!`);
                    // console.log(output); // Don't dump full log on success to save console space

                    if (activeAction === 'build_open') {
                        log("Verifying server...");
                        const isUp = await checkServer(true);
                        if (isUp) {
                            log("Opening Internal...");
                            window.open(serverUrl);
                        } else {
                            log("Server down. Auto-starting...");
                            startServer(absolutePath);

                            const ready = await waitForServer();
                            if (ready) {
                                log("Server Ready! Opening Internal...");
                                window.open(serverUrl);
                            } else {
                                log("Server start timeout. Check logs.");
                            }
                        }
                    }
                }
            });
        }
    };

    const handleStop = async () => {
        setStatus('Stopping server...');
        try {
            const url = new URL(serverUrl);
            const port = url.port || (url.protocol === 'https:' ? '443' : '3000');

            log(`Killing processes on port ${port}...`);

            // Nuclear option for macOS to ensure port is freed
            const cmd = `lsof -ti:${port} | xargs kill -9`;

            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    if (error.code === 1) {
                        log('No server found on port.');
                    } else {
                        log(`Stop failed: ${error.message}`);
                    }
                    return;
                }
                log('Server Stopped.');
                checkServer(true); // Verify it's down
            });
        } catch (e) {
            log(`Error parsing URL: ${e.message}`);
        }
    };

    // --- Deployment Manager Logic ---
    const [showDeployment, setShowDeployment] = useState(false);

    return (
        <div
            onMouseLeave={() => { setIsVisible(false); setShowSettings(false); }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10000,
                transition: 'transform 0.3s ease-in-out',
                transform: isVisible ? 'translateY(0)' : 'translateY(-90%)', // Adjusted for drawer
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Hover Trigger */}
            <div
                onMouseEnter={() => setIsVisible(true)}
                style={{
                    height: '20px',
                    width: '100%',
                    position: 'absolute',
                    bottom: '-20px',
                    zIndex: -1,
                    background: 'transparent'
                }}
            />

            {/* Main Toolbar */}
            <div style={{
                padding: '8px 16px',
                background: '#151515',
                borderBottom: '1px solid #333',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                height: '48px',
                boxSizing: 'border-box'
            }}>
                {/* Title & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <h3 style={{ margin: '0', color: '#fff', fontSize: '14px', fontWeight: '600' }}>Website Control</h3>
                    <span style={{
                        color: status.includes('Error') || status.includes('Failed') ? '#ff4d4d' : '#4ade80',
                        fontSize: '11px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <dc.Icon icon="activity" style={{ width: '12px', height: '12px' }} />
                        {status}
                    </span>
                </div>



                {/* Cloudflare Status Badge */}
                {deployStatus !== 'idle' && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: deployStatus === 'success' ? 'rgba(74, 222, 128, 0.1)' : deployStatus === 'failure' ? 'rgba(248, 81, 73, 0.1)' : 'rgba(227, 179, 65, 0.1)',
                        border: `1px solid ${deployStatus === 'success' ? 'rgba(74, 222, 128, 0.2)' : deployStatus === 'failure' ? 'rgba(248, 81, 73, 0.2)' : 'rgba(227, 179, 65, 0.2)'}`,
                        borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 600,
                        color: deployStatus === 'success' ? '#4ade80' : deployStatus === 'failure' ? '#f85149' : '#e3b341'
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></div>
                        {deployStatus === 'success' ? 'Live' : deployStatus === 'failure' ? 'Failed' : 'Building'}
                    </div>
                )}

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {/* Push Button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        title="Push Deployment"
                        style={{ background: 'none', border: 'none', color: '#58a6ff', cursor: 'pointer', padding: '6px' }}
                    >
                        <dc.Icon icon="upload-cloud" style={{ width: '16px' }} />
                    </button>
                    <button
                        onClick={() => handleExecute('start_dev')}
                        title="Start Dev Server (Build & Open)"
                        style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', padding: '6px' }}
                    >
                        <dc.Icon icon="play" style={{ width: '16px' }} />
                    </button>
                    <button onClick={handleStop} title="Stop" style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '6px' }}><dc.Icon icon="square" style={{ width: '16px' }} /></button>
                    <button onClick={checkServer} title="Retry" style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px' }}><dc.Icon icon="refresh-cw" style={{ width: '16px' }} /></button>
                </div>

                {/* Settings Toggle */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        background: showSettings ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid #333',
                        color: showSettings ? '#fff' : '#888',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 500
                    }}
                >
                    <dc.Icon icon="settings" style={{ width: '14px', height: '14px' }} />
                    Settings
                </button>

                {/* Min/Max */}
                {onToggleFullTab && (
                    <button onClick={onToggleFullTab} title={isFullTab ? "Exit Full" : "Enter Full"} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px' }}>
                        <dc.Icon icon={isFullTab ? "minimize-2" : "maximize-2"} style={{ width: '16px', height: '16px' }} />
                    </button>
                )}
            </div>

            {/* Settings Drawer - Always mounted to preserve state */}
            <div style={{
                background: '#1a1a1a',
                borderBottom: '1px solid #333',
                padding: '24px',
                display: showSettings ? 'flex' : 'none', // Toggle visibility instead of unmounting
                flexDirection: 'column',
                gap: '24px',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                {/* Server Configuration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Header */}
                    <div style={{ paddingBottom: '8px', borderBottom: '1px solid #333', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>Local Server Settings</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>Configure how the development server runs and connects.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#ccc', marginBottom: '6px', fontWeight: 500 }}>Localhost URL</label>
                                <input
                                    type="text"
                                    value={serverUrl}
                                    onChange={(e) => setServerUrl(e.target.value)}
                                    placeholder="http://localhost:3000"
                                    style={{
                                        width: '100%', padding: '10px 12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#eee', fontSize: '13px', outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ width: '220px' }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#ccc', marginBottom: '6px', fontWeight: 500 }}>Command Action</label>
                                <select
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0 12px', // Use horizontal padding only, let height center it
                                        height: '38px', // Match button height
                                        background: '#0d1117',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#eee',
                                        fontSize: '13px',
                                        outline: 'none',
                                        appearance: 'none',
                                        lineHeight: '38px' // Center text vertically
                                    }}
                                >
                                    <option value="start_dev">Start Dev Server</option>
                                    <option value="build_open">Build & Open (Prod)</option>
                                    <option value="build">Build Only</option>
                                    <option value="clean">Uninstall / Clean</option>
                                    <option value="open">Open (Internal)</option>
                                    <option value="force_external">Open (External)</option>
                                </select>
                            </div>
                            <div style={{ alignSelf: 'flex-end' }}>
                                <button
                                    onClick={handleExecute}
                                    style={{
                                        padding: '10px 24px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', height: '38px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    Go
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: '#333', width: '100%' }} />

                {/* Deployment Manager */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>Deployment Configuration</label>
                    <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
                        {DeploymentManager && (
                            <DeploymentManager
                                folderPath={folderPath}
                                onClose={() => { }} // No close needed in drawer
                                gitUtils={gitUtils}
                                cfUtils={cfUtils}
                                onStatusChange={setDeployStatus}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Embed Area */}
            {action === 'embed' && <div />}
        </div >
    );
}

export {  ControlPanel  };
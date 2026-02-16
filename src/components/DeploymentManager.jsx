const { useState, useEffect } = dc;
const path = require('path');

// --- Helper Component: InfoTip ---
const InfoTip = ({ text, link, openUrl }) => {
    const [show, setShow] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const iconRef = dc.useRef(null);

    const handleMouseEnter = () => {
        if (timeoutId) clearTimeout(timeoutId);

        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            // Position above the icon by default
            setCoords({
                top: rect.top,
                left: rect.left
            });
        }
        setShow(true);
    };

    const handleMouseLeave = () => {
        const id = setTimeout(() => {
            setShow(false);
        }, 300);
        setTimeoutId(id);
    };

    return (
        <div
            style={{ display: 'inline-block', marginLeft: '8px' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={iconRef}
                style={{
                    cursor: 'help',
                    fontSize: '11px',
                    color: show ? '#fff' : '#4ade80',
                    borderColor: show ? '#fff' : 'rgba(74, 222, 128, 0.4)',
                    border: '1.5px solid',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: show ? 'rgba(74, 222, 128, 0.2)' : 'transparent',
                    fontWeight: '900',
                    boxShadow: show ? '0 0 10px rgba(74, 222, 128, 0.3)' : 'none'
                }}
            >
                ?
            </div>
            {show && (
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        position: 'fixed',
                        top: (coords.top - 12), // Position relative to viewport
                        left: (coords.left + 24),
                        width: '320px',
                        zIndex: 1000000, // Maximum z-index
                        animation: 'infoTipFadeIn 0.2s ease-out',
                        transform: 'translateY(-100%)' // Move it above the cursor point
                    }}
                >
                    {/* Invisible hover bridge */}
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '100px', height: '100px', pointerEvents: 'none' }} />

                    <div style={{
                        background: 'rgba(10, 10, 10, 0.98)',
                        border: '1px solid #4ade80',
                        padding: '16px',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: '#eee',
                        boxShadow: '0 12px 60px rgba(0,0,0,1)',
                        position: 'relative',
                        lineHeight: '1.6',
                        textAlign: 'left',
                        backdropFilter: 'blur(30px)',
                        wordBreak: 'break-word',
                        pointerEvents: 'auto'
                    }}>
                        <div style={{
                            fontWeight: '900',
                            color: '#4ade80',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <dc.Icon icon="shield-question" style={{ width: 12 }} /> SETUP GUIDE
                        </div>
                        {text}
                        {link && openUrl && (
                            <div
                                onClick={(e) => { e.preventDefault(); openUrl(link.url); }}
                                style={{
                                    marginTop: '14px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    color: '#4ade80',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '800'
                                }}
                            >
                                {link.label} <dc.Icon icon="external-link" style={{ width: 14, height: 14 }} />
                            </div>
                        )}
                        <style>{`
                            @keyframes infoTipFadeIn {
                                from { opacity: 0; transform: translateY(10px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                        {/* Custom Pointer */}
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '-6px',
                            width: '12px',
                            height: '12px',
                            background: '#0a0a0a',
                            borderLeft: '1px solid #4ade80',
                            borderBottom: '1px solid #4ade80',
                            transform: 'rotate(45deg)',
                            zIndex: -1
                        }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Helper: Status Badge ---
const StatusBadge = ({ active, text }) => (
    <span style={{
        fontSize: '10px',
        background: active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        color: active ? '#4ade80' : '#888',
        padding: '2px 8px',
        borderRadius: '12px',
        border: `1px solid ${active ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
    }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#4ade80' : '#666' }}></div>
        {text}
    </span>
);

function DeploymentManager({ folderPath, onClose, gitUtils, cfUtils, onStatusChange }) {
    // Utils
    const { initializeAndPush, createGitHubRepo, deleteGitHubRepo, getGitHubUser, saveEnv, loadEnv, ensureGitIgnore, isGitRepo, initLocalRepo, deleteLocalGit, deleteFolder } = gitUtils || {};
    const { verifyToken: verifyCFToken, createPagesProject, getZones, addDNSRecord, getAccounts, getDeployments, getDeploymentLogs, triggerPagesDeployment, deletePagesProject } = cfUtils || {};

    // UI State
    const [activeTab, setActiveTab] = useState('deploy'); // 'deploy', 'github', 'cloudflare', 'dns'

    // Github State
    const [token, setToken] = useState('');
    const [repoName, setRepoName] = useState('');
    const [repoOwner, setRepoOwner] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [isRepo, setIsRepo] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    // Cloudflare State
    const [cfToken, setCfToken] = useState('');
    const [cfAccountId, setCfAccountId] = useState('');
    const [cfAccountName, setCfAccountName] = useState('');
    const [cfProjectName, setCfProjectName] = useState('datacore-website');
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [generatedSubdomain, setGeneratedSubdomain] = useState('');
    const [showConfirmDeletePages, setShowConfirmDeletePages] = useState(false);

    // Operations State
    const [commitMessage, setCommitMessage] = useState('Update from Datacore');
    const [status, setStatus] = useState('idle'); // idle, working, success, error
    const [logs, setLogs] = useState([]);

    // Deployment Tracking
    const [latestDeployment, setLatestDeployment] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [viewingLogsFor, setViewingLogsFor] = useState(null);
    const [logContent, setLogContent] = useState('');
    const [loadingLogs, setLoadingLogs] = useState(false);

    // DNS State
    const [loadingZones, setLoadingZones] = useState(false);
    const [zoneError, setZoneError] = useState(null);

    // --- Effects ---

    // 0. Notify Parent of Status
    useEffect(() => {
        if (onStatusChange) {
            if (latestDeployment) {
                const s = latestDeployment.latest_stage?.status;
                onStatusChange(s === 'success' ? 'success' : s === 'failure' ? 'failure' : 'building');
            } else if (isPolling) {
                onStatusChange('building');
            } else {
                onStatusChange('idle');
            }
        }
    }, [latestDeployment, isPolling, onStatusChange]);

    // 1. Polling
    useEffect(() => {
        let interval;
        if (isPolling && cfToken && cfAccountId && cfProjectName && getDeployments) {
            const fetchStatus = async () => {
                try {
                    const result = await getDeployments(cfToken, cfAccountId, cfProjectName);
                    if (result.success && result.result.length > 0) {
                        const deploy = result.result[0];
                        setLatestDeployment(deploy);

                        const state = deploy.latest_stage?.status || 'unknown';
                        if (state === 'success' || state === 'failure') {
                            setIsPolling(false);
                            log(`Deployment finished: ${state}`);
                        }
                    } else if (result.notFound) {
                        // Crucia point: Stop polling if the project is actually missing
                        setIsPolling(false);
                        log(`Polling stopped: Project '${cfProjectName}' not found in Cloudflare.`);
                        setLatestDeployment(null);
                    }
                } catch (e) {
                    console.error("Polling failed", e);
                    // If we get an error response that isn't success, but also not "not found",
                    // we keep polling in case it's a transient network issue.
                }
            };
            fetchStatus();
            interval = setInterval(fetchStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [isPolling, cfToken, cfAccountId, cfProjectName, getDeployments]);

    // 2. Initialization & Auto-Migration
    useEffect(() => {
        const init = async () => {
            const storage = dc.app.secretStorage;
            if (!storage) return log("Error: Native Keychain not available.");

            let loadedToken = '';
            let loadedRepo = '';
            let loadedCfToken = '';
            let loadedCfAccountId = '';

            let absPath = folderPath;
            if (!path.isAbsolute(folderPath)) {
                absPath = path.resolve(dc.app.vault.adapter.getBasePath(), folderPath);
            }

            if (isGitRepo) {
                const alreadyRepo = await isGitRepo(absPath);
                setIsRepo(alreadyRepo);
            }

            // A. Check Keychain First (Highest Priority)
            if (typeof storage.getSecret === 'function') {
                loadedToken = await storage.getSecret('dc-github-token');
                loadedCfToken = await storage.getSecret('dc-cf-token');
                loadedCfAccountId = await storage.getSecret('dc-cf-account-id');
            }

            // B. Migration Fallback (localStorage / .env)
            const migGithub = localStorage.getItem('dc_github_token');
            const migCfToken = localStorage.getItem('dc_cf_token');
            const migCfAccount = localStorage.getItem('dc_cf_account_id');

            // Load .env only if keychain is empty (to pick up current data)
            let envData = {};
            if (loadEnv) envData = loadEnv(absPath);

            if (!loadedToken) loadedToken = migGithub || envData.GITHUB_TOKEN || '';
            if (!loadedCfToken) loadedCfToken = migCfToken || envData.CF_API_TOKEN || '';
            if (!loadedCfAccountId) loadedCfAccountId = migCfAccount || envData.CF_ACCOUNT_ID || '';

            // Non-sensitive fields from env/local
            if (envData.REPO_NAME) loadedRepo = envData.REPO_NAME;
            if (!loadedRepo) {
                loadedRepo = path.basename(folderPath).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            }

            const savedProjectName = envData.CF_PROJECT_NAME || localStorage.getItem('dc_cf_project_name');
            if (savedProjectName) {
                setCfProjectName(savedProjectName);
                setGeneratedSubdomain(`${savedProjectName}.pages.dev`);
            } else if (loadedRepo) {
                // If no project name saved, default to repo name (as Pages usually does)
                setCfProjectName(loadedRepo);
                setGeneratedSubdomain(`${loadedRepo}.pages.dev`);
            }

            // C. Final State Update
            setToken(loadedToken);
            setRepoName(loadedRepo);
            setCfToken(loadedCfToken);
            setCfAccountId(loadedCfAccountId);

            if (loadedToken) verifyToken(loadedToken);
            if (loadedCfToken) verifyCloudflare(loadedCfToken);

            if (loadedToken && loadedCfToken) {
                setActiveTab('deploy');
                if (savedProjectName) setIsPolling(true);
            } else {
                setActiveTab('github');
            }

            // D. One-time Cleanup of cleartext copies
            if (loadedToken && migGithub) localStorage.removeItem('dc_github_token');
            if (loadedCfToken && migCfToken) localStorage.removeItem('dc_cf_token');
            if (loadedCfAccountId && migCfAccount) localStorage.removeItem('dc_cf_account_id');
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [folderPath]);

    // 3. Persistence (Secure)
    useEffect(() => {
        const persist = async () => {
            const storage = dc.app.secretStorage;
            if (!storage || typeof storage.setSecret !== 'function') return;

            if (token) await storage.setSecret('dc-github-token', token);
            if (cfToken) await storage.setSecret('dc-cf-token', cfToken);
            if (cfAccountId) await storage.setSecret('dc-cf-account-id', cfAccountId);

            // Keep only project name in localStorage
            if (cfProjectName) localStorage.setItem('dc_cf_project_name', cfProjectName);
        };
        persist();
    }, [token, cfToken, cfAccountId, cfProjectName]);

    // 4. Sanitize Persistence (Stop writing secrets to disk/localStorage)
    // Removed old saveEnv and localStorage effects for tokens.


    // --- Actions ---

    const log = (msg) => setLogs(prev => [...prev, msg]);

    const openUrl = (url) => {
        try {
            if (typeof require !== 'undefined') require('electron').shell.openExternal(url);
            else window.open(url, '_blank');
        } catch (e) { console.error(e); window.open(url, '_blank'); }
    };

    const verifyToken = async (t) => {
        const user = await getGitHubUser(t);
        if (user) {
            setCurrentUser(user.login);
            if (!repoOwner) setRepoOwner(user.login);
        } else {
            setCurrentUser(null);
        }
    };

    const verifyCloudflare = async (t) => {
        if (!verifyCFToken) return;
        try {
            const valid = await verifyCFToken(t);
            if (valid && getAccounts) {
                const accounts = await getAccounts(t);
                if (accounts?.length > 0) {
                    setCfAccountName(`${accounts[0].name}`);
                    // If current ID is empty or wrong length (usually 32 hex), auto-populate
                    if (!cfAccountId || cfAccountId.length !== 32) {
                        setCfAccountId(accounts[0].id);
                    }
                    log(`Linked to Cloudflare Account: ${accounts[0].name}`);
                } else {
                    setCfAccountName('No Accounts Found');
                }
                if (getZones) {
                    const z = await getZones(t);
                    setZones(z || []);
                    if (z && z.length > 0) {
                        if (!selectedZone) setSelectedZone(z[0].id);
                        log(`Found ${z.length} DNS zone(s).`);
                    }
                }
            } else {
                setCfAccountName('Invalid Token');
            }
        } catch (e) {
            console.error("[CF Verify] Error:", e);
            setCfAccountName('Verification Failed');
        }
    };

    const handlePush = async () => {
        if (!token || !repoName) return log('Error: Missing GitHub credentials');
        setStatus('working');
        setLogs([]);

        try {
            let repoUrl;
            log(`Ensuring GitHub repo '${repoName}' exists...`);
            const res = await createGitHubRepo(token, repoName, "Deployed via Datacore", isPrivate);
            if (res.success) {
                if (res.existed) {
                    repoUrl = res.html_url || `https://github.com/${currentUser}/${repoName}.git`;
                    log(`GitHub repo already exists. Using: ${repoUrl}`);
                } else {
                    repoUrl = res.url;
                    log(`GitHub repo created.`);
                }
            } else if (res.error?.includes('exists')) {
                // Fallback for older gitUtils versions or unhandled cases
                repoUrl = `https://github.com/${currentUser}/${repoName}.git`;
                log(`GitHub repo already exists (error fallback).`);
            } else {
                throw new Error(res.error);
            }

            let absPath = folderPath;
            if (!path.isAbsolute(folderPath)) absPath = path.resolve(dc.app.vault.adapter.getBasePath(), folderPath);

            log('Cleaning build cache (.next)...');
            if (deleteFolder) await deleteFolder(absPath, '.next');
            if (ensureGitIgnore) await ensureGitIgnore(absPath);

            log('Pushing code...');
            const pushRes = await initializeAndPush(absPath, repoUrl, token, commitMessage);
            pushRes.logs.forEach(l => log(l));

            if (pushRes.success) {
                setStatus('success');
                setIsRepo(true);
                if (cfProjectName && cfToken) {
                    log('Waiting 3s for GitHub-Cloudflare sync...');
                    await new Promise(r => setTimeout(r, 3000));
                    log('Triggering Cloudflare build...');
                    await triggerPagesDeployment(cfToken, cfAccountId, cfProjectName);
                    setIsPolling(true);
                }
            } else {
                throw new Error('Push failed.');
            }
        } catch (e) {
            log(`Error: ${e.message}`);
            setStatus('error');
        }
    };

    const handleCreatePages = async () => {
        if (!cfToken || !cfAccountId || !repoName) {
            setStatus('error');
            return log('Error: Missing Cloudflare info or Repo Name');
        }

        // Ensure repoOwner is present. If missing but token exists, try to detect it
        let owner = repoOwner;
        if (!owner && token) {
            log('Detecting GitHub owner...');
            try {
                const user = await getGitHubUser(token);
                if (user) {
                    owner = user.login;
                    setRepoOwner(owner);
                    setCurrentUser(owner);
                    log(`Detected owner: ${owner}`);
                }
            } catch (e) { log(`Detection failed: ${e.message}`); }
        }

        if (!owner) {
            setStatus('error');
            return log('Error: GitHub Owner missing. Please verify your GitHub token in the GitHub tab.');
        }

        setStatus('working');
        try {
            const target = cfProjectName || repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            log(`Linking Pages project '${target}' to ${owner}/${repoName}...`);
            const res = await createPagesProject(cfToken, cfAccountId, target, owner, repoName);
            if (res.success) {
                setGeneratedSubdomain(res.subdomain);
                setStatus('success');
                log(`Project '${target}' is now linked.`);
                if (res.alreadyExists) log('Note: Project already existed, linked anyway.');
            } else throw new Error(res.error);
        } catch (e) {
            log(`Error: ${e.message}`);
            setStatus('error');
        }
    };

    const handleDNS = async () => {
        if (!cfToken || !selectedZone || !subdomain) return;
        setStatus('working');
        try {
            const target = generatedSubdomain || `${cfProjectName}.pages.dev`;
            const res = await addDNSRecord(cfToken, selectedZone, 'CNAME', subdomain, target);
            if (res.success) {
                log('CNAME added successfully');
                setStatus('success');
            }
        } catch (e) {
            log(`DNS Error: ${e.message}`);
            setStatus('error');
        }
    };

    const handleRefreshZones = async () => {
        if (!cfToken || !getZones) return;
        setLoadingZones(true);
        setZoneError(null);
        try {
            const z = await getZones(cfToken);
            setZones(z || []);
            if (z && z.length > 0) {
                setSelectedZone(z[0].id);
                log(`Refreshed: Found ${z.length} zones.`);
            } else {
                setZoneError('No zones found. Check permissions (Zone:Read).');
            }
        } catch (e) {
            setZoneError(e.message);
            log(`Zone refresh failed: ${e.message}`);
        } finally {
            setLoadingZones(false);
        }
    };

    const handleInitRepo = async () => {
        let absPath = folderPath;
        if (!path.isAbsolute(folderPath)) absPath = path.resolve(dc.app.vault.adapter.getBasePath(), folderPath);

        setStatus('working');
        const res = await initLocalRepo(absPath);
        if (res.success) {
            setIsRepo(true);
            setStatus('success');
            log('Initialized Git repository.');
        } else {
            log(res.logs[res.logs.length - 1]);
            setStatus('error');
        }
    };

    const handleDeleteLocalGit = async () => {
        let absPath = folderPath;
        if (!path.isAbsolute(folderPath)) absPath = path.resolve(dc.app.vault.adapter.getBasePath(), folderPath);

        setStatus('working');
        const res = await deleteLocalGit(absPath);
        if (res.success) {
            setIsRepo(false);
            setStatus('success');
            log('Removed local .git folder.');
        } else {
            log(`Error: ${res.error}`);
            setStatus('error');
        }
    };

    // --- Render Components ---

    const renderTabButton = (id, label, icon) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                background: activeTab === id ? '#333' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: activeTab === id ? '#fff' : '#888',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                flex: 1,
                justifyContent: 'center'
            }}
        >
            <dc.Icon icon={icon} style={{ width: 14, height: 14 }} />
            {label}
        </button>
    );

    const renderInput = (label, value, onChange, type = "text", placeholder = "", tip = null) => (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>{label}</label>
                {tip && <InfoTip text={tip.text} link={tip.link} openUrl={openUrl} />}
            </div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '14px',
                    outline: 'none',
                    lineHeight: '1.5',
                    minHeight: '40px'
                }}
            />
        </div>
    );

    return (
        <div style={{ fontFamily: 'Inter, sans-serif', color: '#c9d1d9', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* 1. Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid #30363d', marginBottom: '20px' }}>
                {renderTabButton('deploy', 'Deploy', 'rocket')}
                {renderTabButton('github', 'GitHub', 'github')}
                {renderTabButton('cloudflare', 'Pages', 'cloud')}
                {renderTabButton('dns', 'DNS', 'globe')}
            </div>

            {/* 2. Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>

                {/* --- TAB: DEPLOY --- */}
                {activeTab === 'deploy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Status Cards */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
                                <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '6px' }}>GitHub Repo</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{repoName || 'Not Set'}</span>
                                    </div>
                                    <StatusBadge active={isRepo} text={isRepo ? 'Connected' : 'Missing'} />
                                </div>
                            </div>
                            <div style={{ flex: 1, background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '16px' }}>
                                <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '6px' }}>Cloudflare Project</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{cfProjectName || 'Not Set'}</span>
                                    <StatusBadge active={!!cfAccountName && !cfAccountName.includes('Invalid')} text={cfAccountName ? 'Linked' : 'Missing'} />
                                </div>
                            </div>
                        </div>

                        {/* Deployment Controls */}
                        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>New Deployment</h3>
                            <input
                                type="text"
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Describe your changes..."
                                style={{ width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                            />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={handlePush}
                                    disabled={status === 'working'}
                                    style={{ flex: 2, padding: '12px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                                >
                                    Commit & Push to GitHub
                                </button>
                                <button
                                    onClick={async () => {
                                        setStatus('working');
                                        log('Manual triggering build...');
                                        try {
                                            await triggerPagesDeployment(cfToken, cfAccountId, cfProjectName);
                                            setIsPolling(true);
                                            setStatus('success');
                                        } catch (e) { log(e.message); setStatus('error'); }
                                    }}
                                    disabled={status === 'working'}
                                    style={{ flex: 1, padding: '12px', background: '#21262d', color: '#ccc', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Rebuild Pages
                                </button>
                            </div>
                        </div>

                        {/* Maintenance Row */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!isRepo && (
                                <button
                                    onClick={handleInitRepo}
                                    style={{ flex: 1, padding: '8px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <dc.Icon icon="plus-circle" style={{ width: 12 }} />
                                    Initialize Git
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('github')}
                                style={{ flex: 1, padding: '8px', background: 'rgba(248, 81, 73, 0.05)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <dc.Icon icon="trash-2" style={{ width: 12 }} />
                                Delete Remote Repo
                            </button>
                            <button
                                onClick={async () => {
                                    setStatus('working');
                                    log('Cleaning project...');
                                    // We use a trick: trigger the 'clean' action in the parent ControlPanel if we were connected to it,
                                    // BUT here we can just spawn the command directly since it's a script.
                                    let absPath = folderPath;
                                    if (!path.isAbsolute(folderPath)) absPath = path.resolve(dc.app.vault.adapter.getBasePath(), folderPath);

                                    const { exec } = require('child_process');
                                    exec('npm run clean', { cwd: absPath }, (err) => {
                                        if (err) { log(`Clean failed: ${err.message}`); setStatus('error'); }
                                        else { log('Project cleaned.'); setStatus('success'); }
                                    });
                                }}
                                style={{ flex: 1, padding: '8px', background: 'rgba(255, 255, 255, 0.05)', color: '#888', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <dc.Icon icon="refresh-cw" style={{ width: 12 }} />
                                Clean Local
                            </button>
                            <button
                                onClick={handleDeleteLocalGit}
                                style={{ flex: 1, padding: '8px', background: 'rgba(248, 81, 73, 0.05)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <dc.Icon icon="git-branch" style={{ width: 12 }} />
                                Delete Local Git
                            </button>
                        </div>

                    </div>
                )}

                {/* --- TAB: GITHUB CONFIG --- */}
                {activeTab === 'github' && (
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px' }}>
                        <div style={{ background: '#21262d', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#c9d1d9', border: '1px solid #30363d' }}>
                            <dc.Icon icon="info" style={{ width: 14, marginRight: 8, verticalAlign: 'text-bottom' }} />
                            Configure your GitHub connection. You only need to do this once.
                        </div>

                        {renderInput(
                            "Personal Access Token (Classic)",
                            token,
                            (val) => {
                                setToken(val);
                                if (val.startsWith('ghp_')) verifyToken(val);
                            },
                            "password",
                            "ghp_...",
                            {
                                text: "Generate a 'Classic' token to allow Datacore to manage your repository. Requires 'repo' scope (for private repos) and 'delete_repo' if you want to use the cleanup feature.",
                                link: { label: 'GitHub Settings', url: 'https://github.com/settings/tokens/new?scopes=repo,delete_repo' }
                            }
                        )}
                        {renderInput(
                            "Repository Owner",
                            repoOwner,
                            setRepoOwner,
                            "text",
                            "username",
                            { text: "Your GitHub username. This is automatically detected when you paste a valid token above." }
                        )}
                        {renderInput(
                            "Repository Name",
                            repoName,
                            setRepoName,
                            "text",
                            "my-website",
                            { text: "The name of the repo on GitHub. If it doesn't exist, Datacore will create a new one for you." }
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} id="priv" style={{ width: 16, height: 16 }} />
                            <label htmlFor="priv" style={{ fontSize: '14px' }}>Private Repository</label>
                        </div>

                        <div style={{ paddingTop: '20px', borderTop: '1px solid #30363d', marginTop: '12px' }}>
                            <label style={{ fontSize: '13px', color: '#f85149', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Danger Zone</label>
                            {!showConfirmDelete ? (
                                <button onClick={() => setShowConfirmDelete(true)} style={{ width: '100%', padding: '12px', background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Delete Repository</button>
                            ) : (
                                <button onClick={async () => {
                                    setStatus('working');
                                    const res = await deleteGitHubRepo(token, currentUser, repoName);
                                    if (res.success) { setStatus('success'); log('Deleted repo'); setIsRepo(false); setShowConfirmDelete(false); }
                                    else log(res.error);
                                }} style={{ width: '100%', padding: '12px', background: '#da3633', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Confirm Delete</button>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: CLOUDFLARE CONFIG --- */}
                {activeTab === 'cloudflare' && (
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px' }}>
                        <div style={{ background: '#21262d', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#c9d1d9', border: '1px solid #30363d' }}>
                            <dc.Icon icon="info" style={{ width: 14, marginRight: 8, verticalAlign: 'text-bottom' }} />
                            Connect your Cloudflare account to enable automatic deployments.
                        </div>

                        {renderInput(
                            "Project Name (Pages)",
                            cfProjectName,
                            setCfProjectName,
                            "text",
                            "my-site",
                            { text: "The name of your Cloudflare Pages project. This will determine your staging URL (e.g. name.pages.dev)." }
                        )}
                        {renderInput(
                            "Cloudflare API Token",
                            cfToken,
                            (val) => {
                                setCfToken(val);
                                if (val.length > 30) verifyCloudflare(val);
                            },
                            "password",
                            "...",
                            {
                                text: "Create a Custom Token with 'Account:Read', 'Pages:Edit', and 'DNS:Edit' permissions.",
                                link: { label: 'Cloudflare API Tokens', url: 'https://dash.cloudflare.com/profile/api-tokens' }
                            }
                        )}
                        {renderInput(
                            "Account ID",
                            cfAccountId,
                            setCfAccountId,
                            "password",
                            "...",
                            {
                                text: "Find your 32-character Account ID at the bottom right of the 'Workers & Pages' dashboard on Cloudflare.",
                                link: { label: 'Cloudflare Dashboard', url: 'https://dash.cloudflare.com/pages' }
                            }
                        )}

                        <button
                            onClick={handleCreatePages}
                            style={{ width: '100%', padding: '12px', marginTop: '12px', background: '#f48120', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                        >
                            Link / Create Project
                        </button>

                        <div style={{ paddingTop: '20px', borderTop: '1px solid #30363d', marginTop: '20px' }}>
                            <label style={{ fontSize: '13px', color: '#f85149', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Danger Zone</label>
                            {!showConfirmDeletePages ? (
                                <button onClick={() => setShowConfirmDeletePages(true)} style={{ width: '100%', padding: '12px', background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Delete Cloudflare Project</button>
                            ) : (
                                <button onClick={async () => {
                                    setStatus('working');
                                    const res = await deletePagesProject(cfToken, cfAccountId, cfProjectName);
                                    if (res.success) { setStatus('success'); log('Deleted Pages Project'); setShowConfirmDeletePages(false); }
                                    else log(res.error);
                                }} style={{ width: '100%', padding: '12px', background: '#da3633', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Confirm Delete</button>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: DNS --- */}
                {activeTab === 'dns' && (
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px' }}>
                        <div style={{ background: '#21262d', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#c9d1d9', border: '1px solid #30363d' }}>
                            <dc.Icon icon="globe" style={{ width: 14, marginRight: 8, verticalAlign: 'text-bottom' }} />
                            Point a custom domain to your deployed site.
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '13px', color: '#ccc', fontWeight: 500 }}>Select Zone (Domain)</label>
                                <button
                                    onClick={handleRefreshZones}
                                    disabled={loadingZones}
                                    style={{ background: 'none', border: 'none', color: '#58a6ff', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    {loadingZones ? 'Fetching...' : 'Refresh List'}
                                </button>
                            </div>
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                disabled={loadingZones}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#161b22',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px',
                                    outline: 'none',
                                    height: '42px',
                                    opacity: loadingZones ? 0.6 : 1
                                }}
                            >
                                <option value="">Select a domain...</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                            {zoneError && <div style={{ marginTop: '6px', fontSize: '11px', color: '#f85149' }}>⚠️ {zoneError}</div>}
                        </div>

                        {renderInput("Subdomain (e.g., 'blog')", subdomain, setSubdomain, "text", "www")}

                        <div style={{ fontSize: '13px', color: '#8b949e', marginBottom: '20px', fontStyle: 'italic' }}>
                            Will route <strong>{subdomain ? `${subdomain}.` : ''}{zones.find(z => z.id === selectedZone)?.name || '...'}</strong> to <strong>{cfProjectName}.pages.dev</strong>
                        </div>

                        <button
                            onClick={handleDNS}
                            style={{ width: '100%', padding: '12px', background: '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                        >
                            Add CNAME Record
                        </button>
                    </div>
                )}

                {/* 3. Global Status & Logs */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #30363d', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'working' ? '#e3b341' : status === 'success' ? '#4ade80' : status === 'error' ? '#f85149' : '#8b949e' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {status === 'working' ? 'Busy' : status === 'success' ? 'Ready' : status === 'error' ? 'Error' : 'Idle'}
                            </span>
                        </div>
                        {(latestDeployment || isPolling) && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: latestDeployment?.latest_stage?.status === 'success' ? '#4ade80' :
                                    latestDeployment?.latest_stage?.status === 'failure' ? '#f85149' : '#e3b341'
                            }}>
                                {latestDeployment?.latest_stage?.status?.toUpperCase() || 'INITIALIZING'}
                            </span>
                        )}
                    </div>

                    <div style={{ background: '#0d1117', borderRadius: '8px', padding: '12px', border: '1px solid #30363d' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#8b949e', fontWeight: 600 }}>TERMINAL LOGS</span>
                            {latestDeployment && (
                                <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); props.fetchLogs(latestDeployment.id); }} style={{ color: '#58a6ff', textDecoration: 'none' }}>View Build Logs</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); openUrl(latestDeployment.url); }} style={{ color: '#58a6ff', textDecoration: 'none' }}>Open Preview ↗</a>
                                </div>
                            )}
                        </div>
                        <pre style={{ margin: 0, fontSize: '11px', color: '#c9d1d9', fontFamily: 'Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                            {logs.length > 0 ? logs.join('\n') : 'Ready for action.'}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

return { DeploymentManager };

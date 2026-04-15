// ─────────────────────────────────────────────────────────────
// 🖥️ COMPONENT: MAIN APPLICATION ORCHESTRATOR (Unified Control)
// ─────────────────────────────────────────────────────────────

function App({ dc, modules, folderPath, onExport }) {
    const { Platform } = modules;
    const { useState, useEffect, useRef, useCallback, useMemo } = Platform;

    const { TOKENS, GLOBAL_CSS, parseResumeMarkdown, NodeGraph, GeometricParticles, CinematicViewer, FloatingScene, PrintLayout, DeployBridge, MCPBridge } = modules;
    const adapter = useMemo(() => modules.createAdapter(dc, modules), [dc, modules]);
    
    const containerRef = useRef(null);
    const nodeGraphControlRef = useRef(null);
    const [resumeData, setResumeData] = useState(null);
    const [focusedNode, setFocusedNode] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [modulesReady, setModulesReady] = useState(false);
    const modulesRef = useRef({ THREE: null, gsap: null });
    const hudTimeoutRef = useRef(null);
    const [isHudVisible, setIsHudVisible] = useState(false);
    const [exportMode, setExportMode] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSystemMenu, setShowSystemMenu] = useState(false);
    const [showSectorsMenu, setShowSectorsMenu] = useState(false);
    const [activeNode, setActiveNode] = useState(null);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [globalScroll, setGlobalScroll] = useState(0);
    const [printTheme, setPrintTheme] = useState('dark');

    // 🏷️ DYNAMIC FILENAME PROTOCOL: Force browser to use classified dossier names
    useEffect(() => {
        if (exportMode && resumeData?.about?.name) {
            const oldTitle = document.title;
            const themeLabel = printTheme.toUpperCase();
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
            const userName = resumeData.about.name.toUpperCase().replace(/\s+/g, '_');
            document.title = `CLASSIFIED_DOSSIER_${userName}_[${themeLabel}]_${timestamp}`;
            console.log(`[URB_HOIST] Filename Synced: ${document.title}`);
            return () => { document.title = oldTitle; };
        }
    }, [exportMode, printTheme, resumeData]);

    // Deployment State
    const [status, setStatus] = useState("IDLE");
    const [activeTab, setActiveTab] = useState('IDENTITY');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [logs, setLogs] = useState([]);
    
    // Core Configuration State
    const [repoName, setRepoName] = useState(localStorage.getItem('urb_repo_name') || "ultimate-resume-builder");
    const [ghToken, setGhToken] = useState("");
    const [ghClientId, setGhClientId] = useState(localStorage.getItem('urb_gh_client_id') || "");
    const [ghClientSecret, setGhClientSecret] = useState("");
    const [keystaticSecret, setKeystaticSecret] = useState("");
    const [ghAppSlug, setGhAppSlug] = useState(localStorage.getItem('urb_gh_app_slug') || "");

    const deploymentLogic = useMemo(() => modules.getDeploymentLogic(dc), [modules, dc]);
    const addLog = useCallback((m) => setLogs(p => [m, ...p].slice(0, 5)), []);

    const updateSecret = async (key, val, setter) => {
        setter(val);
        const storage = dc?.app?.secretStorage || window.app?.secretStorage;
        if (storage && typeof storage.setSecret === 'function') await storage.setSecret(key, val);
    };

    const updatePersistent = (key, val, setter) => {
        setter(val);
        localStorage.setItem(key, val);
    };

    const handleDeploy = useCallback(async () => {
        console.log("%c[App] COMMAND: COMPILE_LOCAL", "background: #f59e0b; color: #000; font-weight: bold; padding: 2px 5px; border-radius: 2px;");
        if (!deploymentLogic) { console.error("[App] deploymentLogic MISSING"); return; }
        await deploymentLogic.handleLocalDeploy({
            addLog,
            setStatus,
            setIsDeploying,
            folderPath
        });
    }, [deploymentLogic, addLog, setStatus, folderPath]);

    const handlePublish = useCallback(async () => {
        console.log("%c[App] COMMAND: PUBLISH_NATIVE", "background: #10b981; color: #fff; font-weight: bold; padding: 2px 5px; border-radius: 2px;");
        await deploymentLogic.handlePublish({
            repoName,
            ghToken,
            addLog,
            setStatus,
            setIsPublishing,
            folderPath
        });
    }, [deploymentLogic, repoName, ghToken, addLog, setStatus, folderPath]);

    const handleWebPublish = useCallback(async () => {
        console.log("%c[App] COMMAND: PUBLISH_WEB", "background: #3b82f6; color: #fff; font-weight: bold; padding: 2px 5px; border-radius: 2px;");
        await deploymentLogic.handleWebPublish({
            addLog,
            setStatus,
            setIsPublishing,
            folderPath,
            envConfig: {
                GITHUB_OAUTH_CLIENT_ID: ghClientId,
                GITHUB_OAUTH_SECRET: ghClientSecret,
                KEYSTATIC_SECRET: keystaticSecret,
                NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: ghAppSlug
            }
        });
    }, [deploymentLogic, addLog, setStatus, folderPath, ghClientId, ghClientSecret, keystaticSecret, ghAppSlug]);

    const showHud = useCallback(() => {
        if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
        setIsHudVisible(true);
    }, []);

    const hideHud = useCallback((force = false) => {
        if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
        if (showSettings && !force) return;
        
        hudTimeoutRef.current = setTimeout(() => {
            setIsHudVisible(false);
        }, 300);
    }, [showSettings]);

    useEffect(() => {
        return () => { if(hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current); };
    }, []);

    const handleNodeFocus = useCallback((node) => {
        if (!node) return;
        setFocusedNode(node);
        if (resumeData?.nodes) {
            const idx = resumeData.nodes.findIndex(n => n.id === node.id);
            if (idx !== -1) setActiveIndex(idx);
        }
        setActiveNode(node);
    }, [resumeData]);

    const handleWheel = useCallback((e) => {
        if (!resumeData?.nodes || exportMode || showSettings) return;
        if (e.target.closest('.cinematic-frame')) return;
        e.preventDefault();
        if (nodeGraphControlRef.current) {
            const clampedDelta = Math.max(-400, Math.min(400, e.deltaY));
            nodeGraphControlRef.current.spin(clampedDelta);
            if (isAutoPlay) setIsAutoPlay(false);
        }
    }, [resumeData, isAutoPlay, exportMode, showSettings]);

    useEffect(() => {
        let active = true;
        async function init() {
            // 1. Dependencies
            try {
                const T = await modules.loadScript(dc, "https://unpkg.com/three@0.149.0/build/three.min.js", { globalName: 'THREE' });
                const G = await modules.loadScript(dc, "https://unpkg.com/gsap@3.12.5/dist/gsap.min.js", { globalName: 'gsap' });
                if (active) {
                    modulesRef.current.THREE = T;
                    modulesRef.current.gsap = G;
                    setModulesReady(true);
                }
            } catch (e) { console.error("[URB] Dependency load failed:", e); }

            // 2. Authentication (Priority: SecretStorage -> Keychain Fallback)
            const storage = dc?.app?.secretStorage || window.app?.secretStorage;
            let token = "";
            let source = "NONE";

            // 💾 PRIMARY: Obsidian Secret Storage (Manual UI Input / Classic Token)
            if (storage && typeof storage.getSecret === 'function') {
                const cached = await storage.getSecret('urb-github-token') || await storage.getSecret('dc-github-token');
                if (cached) {
                    token = cached.trim();
                    source = "MANUAL_UI";
                }
                const cachedClientId = await storage.getSecret('urb-gh-client-secret');
                if (cachedClientId) setGhClientSecret(cachedClientId.trim());
                const cachedKeystatic = await storage.getSecret('urb-keystatic-secret');
                if (cachedKeystatic) setKeystaticSecret(cachedKeystatic.trim());
            }

            // 🛡️ SECONDARY: NATIVE KEYCHAIN FALLBACK (Optional OS Session)
            if (!token) {
                try {
                    const { execSync } = require('child_process');
                    const cmd = `security find-generic-password -s "gh:github.com" -w || security find-generic-password -s "github.com" -w || security find-generic-password -s "GitHub" -w`;
                    let raw = execSync(cmd, { encoding: 'utf8' }).replace(/[\r\n]/g, '').trim();
                    if (raw) {
                        if (raw.startsWith('go-keyring-base64:')) {
                            try {
                                const b64 = raw.split(':')[1].trim();
                                if (typeof Buffer !== 'undefined') {
                                    token = Buffer.from(b64, 'base64').toString('utf8').trim();
                                } else {
                                    token = decodeURIComponent(escape(window.atob(b64))).trim();
                                }
                            } catch (e) { console.error("[App] Keychain decode failed:", e); }
                        } else {
                            token = raw;
                        }
                        if (token) source = "NATIVE_KEYCHAIN";
                    }
                } catch (e) { /* Expected if gh CLI not installed or no entry */ }
            }

            if (active && token) {
                console.log(`%c[App] AUTH_READY [Source: ${source}]: prefix=${token.slice(0, 4)}, len=${token.length}`, "color: #10b981; font-weight: bold;");
                setGhToken(token);
            }
        }
        init();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        async function loadData() {
            try {
                const vault = dc?.app?.vault;
                if (!vault) {
                    // 🌐 Web Fallback: Load from local JSON/MD if on web
                    console.log("[URB] Web Environment detected. Skipping Vault read.");
                    return;
                }
                const path = `_RESOURCES/DATACORE/142_UltimateResumeBuilder/_resources/data/resume.md`;
                let text = "";
                if (await vault.adapter.exists(path)) text = await vault.adapter.read(path);
                
                if (text) {
                    const data = parseResumeMarkdown(text);
                    setResumeData(data);
                    if (data.nodes?.length > 0) {
                        setFocusedNode(data.nodes[0]);
                        setActiveIndex(0);
                        if (data.groups?.[0]) setActiveTab(data.groups[0].name);
                    }
                }
            } catch (e) { console.error('[URB] Data Load Error:', e); }
        }
        loadData();
    }, [folderPath]);

    useEffect(() => {
        const el = containerRef.current;
        if (el) el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el?.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // [SKILL] FULLTAB DOM REPARENTING: Force UI to expand to workspace leaf
    useEffect(() => {
        if (Platform.type === 'web') return; // Skip in web env
        const settleTimeout = setTimeout(() => {
            console.log("[URB] Initiating FullTab Reparenting...");
            if (!containerRef.current) return;
            const container = containerRef.current;
            let leaf = container.closest('.workspace-leaf') || document.querySelector('.workspace-leaf.mod-active');
            if (!leaf) { console.warn("[URB] No active leaf found for reparenting."); return; }
            const wrapper = leaf.querySelector('.view-content');
            if (!wrapper) { console.warn("[URB] No .view-content found in leaf."); return; }
            
            if (window.getComputedStyle(wrapper).position === 'static') wrapper.style.position = "relative";
            wrapper.style.overflow = "hidden";
            wrapper.appendChild(container);
            Object.assign(container.style, { position: "absolute", inset: "0px", zIndex: "9998", display: "flex" });
            console.log("[URB] FullTab Reparenting SUCCESS. Managed by BETO.SKILL.");
        }, 800);
        return () => clearTimeout(settleTimeout);
    }, []);

    const handleExtraction = async () => {
        console.log(`[URB_HOIST] Initiating Manifest (Theme: ${printTheme})...`);
        const printArea = document.querySelector('.urb-print-area');
        if (!printArea) {
            console.error("[URB_HOIST] CRITICAL_FAILURE: Manifest target not found.");
            return;
        }

        const originalParent = printArea.parentElement;
        const originalNextSibling = printArea.nextSibling;

        try {
            console.log("[URB_HOIST] Reparenting Manifest to Document Root...");
            document.body.appendChild(printArea);
            document.body.classList.add('urb-is-printing');
            document.body.classList.add(`urb-theme-${printTheme}`);
            
            console.log("[URB_HOIST] Handover to Browser Manifest Engine...");
            window.print();
            
            setTimeout(() => {
                console.log("[URB_HOIST] Restoring Manifest to Orbital Position...");
                if (originalNextSibling) originalParent.insertBefore(printArea, originalNextSibling);
                else originalParent.appendChild(printArea);
                
                document.body.classList.remove('urb-is-printing');
                document.body.classList.remove(`urb-theme-dark`);
                document.body.classList.remove(`urb-theme-light`);
                setStatus("IDLE");
            }, 600);
        } catch (err) {
            console.error("[URB_HOIST] Extraction Crash:", err);
            document.body.classList.remove('urb-is-printing');
            setStatus("ERROR_HOIST");
        }
    };

    const [hoveredBtn, setHoveredBtn] = useState(null);
    const renderTooltip = (label) => {
        if (hoveredBtn !== label) return null;
        return <div className="urb-tooltip-js fade-in">{label}</div>;
    };

    if (!resumeData) return <div style={{ color: 'white', padding: 20 }}>Initializing Elite Resume Interface...</div>;

    return (
        <div ref={containerRef} className={`urb-root ${exportMode ? 'urb-print-mode' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#050508' }}>
            <style>{GLOBAL_CSS + `
                    @media print {
                        @page { margin: 1cm; size: auto; }
                        
                        /* 🛰️ STANDARD RESTORATION: Hide HUD, Show Manifest */
                        .urb-hud-overlay, .urb-hover-sensor, .cinematic-immersion-stage, .urb-viewport { display: none !important; }
                        
                        .urb-root { height: auto !important; min-height: 100vh !important; background: #050508 !important; visibility: visible !important; position: static !important; }
                        
                        .urb-export-modal { 
                            position: absolute !important; inset: 0 !important; 
                            display: flex !important; visibility: visible !important;
                            background: #050508 !important; z-index: 99999 !important;
                        }
                        
                        .cinematic-frame { width: 100% !important; height: auto !important; margin: 0 !important; border: none !important; box-shadow: none !important; background: #050508 !important; }
                        .urb-export-glass { background: #050508 !important; backdrop-filter: none !important; border: none !important; }
                        .urb-export-header { display: none !important; }
                        .urb-preview-container { height: auto !important; overflow: visible !important; }
                        .urb-preview-content { transform: none !important; width: 100% !important; visibility: visible !important; }
                        
                        body, html { background: #050508 !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                    }
            `}</style>
            
            <div className="urb-hover-sensor" onMouseEnter={showHud} />

            <div className="urb-viewport fade-in" 
                style={{ 
                    height: '100%', position: 'relative', overflow: 'hidden', background: '#050508'
                }}
            >
                <div style={{ 
                    opacity: focusedNode?.panelType === 'TIMELINE' ? 0.2 : 1, 
                    transition: 'opacity 1s ease' 
                }}>
                    <GeometricParticles dc={dc} modules={modules} TOKENS={TOKENS} />
                </div>
                
                <div style={{ 
                    position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none',
                    opacity: focusedNode?.panelType === 'TIMELINE' ? 0.15 : 1, 
                    transition: 'opacity 1s ease' 
                }}>
                    <NodeGraph 
                        data={resumeData} 
                        dc={dc} 
                        modules={modules}
                        focusedNode={focusedNode} 
                        onNodeFocus={handleNodeFocus}
                        onScrollChange={setGlobalScroll}
                        TOKENS={TOKENS} 
                        controlRef={nodeGraphControlRef}
                    />
                </div>
                
                <div className="cinematic-immersion-stage" style={{ position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none' }}>
                    {modulesReady && (
                        <FloatingScene 
                            node={focusedNode} 
                            scroll={globalScroll}
                            activeTab={activeTab}
                            isAutoPlay={isAutoPlay}
                            dc={dc} 
                            modules={{ ...modules, ...modulesRef.current }} 
                            TOKENS={TOKENS} 
                        />
                    )}
                </div>
            </div>

            {exportMode && (
                <div className="urb-export-modal fade-in" style={{ position: 'absolute', inset: 0, zIndex: 20002, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'none' }}>
                    <div className="cinematic-frame fade-in" style={{ width: '90%', height: '85vh', maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}>
                        <div className="urb-export-glass" style={{ 
                            position: 'relative', width: '100%', height: '100%', 
                            background: TOKENS.glassBg, borderRadius: '8px', overflow: 'hidden', 
                            border: `1px solid ${TOKENS.border}`, 
                            boxShadow: '0 60px 120px rgba(0,0,0,0.95)',
                            backdropFilter: 'none',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            <div className="urb-export-header" style={{ 
                                padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: `1px solid rgba(255,255,255,0.08)`,
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                                    <div style={{ fontSize: 10, color: TOKENS.textDim, fontFamily: TOKENS.fontMono, letterSpacing: 2 }}>
                                        MANIFEST://CLASSIFIED_DOSSIER_{resumeData?.about?.name?.toUpperCase() || 'BETO'}_2026.pdf
                                    </div>
                                </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className={`urb-act-btn ${printTheme === 'dark' ? 'active' : ''}`} onClick={() => setPrintTheme('dark')} style={{ fontSize: 7, padding: '4px 8px' }}>DARK_DOSSIER</button>
                                        <button className={`urb-act-btn ${printTheme === 'light' ? 'active' : ''}`} onClick={() => setPrintTheme('light')} style={{ fontSize: 7, padding: '4px 8px' }}>LIGHT_MANIFEST</button>
                                    </div>
                                    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />
                                    <button className="urb-act-btn primary" onClick={handleExtraction}>MANIFEST_PHYSICAL</button>
                                    <button className="urb-act-btn" onClick={() => setExportMode(false)}>CLOSE</button>
                            </div>

                            <div 
                                className="urb-preview-container" 
                                onMouseEnter={() => setIsZoomed(true)}
                                onMouseLeave={() => setIsZoomed(false)}
                                style={{ 
                                    overflowY: isZoomed ? 'auto' : 'hidden',
                                    cursor: isZoomed ? 'crosshair' : 'zoom-in'
                                }}
                            >
                                <div className={`urb-preview-content ${isZoomed ? 'zoomed' : 'scaled'}`} style={{ 
                                    transform: isZoomed ? 'scale(1)' : 'scale(0.32)' 
                                }}>
                                    <div className="urb-print-area">
                                        <PrintLayout data={resumeData} TOKENS={TOKENS} dc={dc} modules={modules} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {resumeData && (
                <>
                    {/* 🛰️ HUD HIT-ZONE: Deep detection layer (Behind HUD to prevent click-blocking) */}
                    <div 
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, zIndex: 59999, pointerEvents: 'auto' }}
                        onMouseEnter={showHud}
                    />

                    <div 
                        id="urb-hud-stack" 
                        onMouseEnter={showHud}
                        onMouseLeave={() => hideHud()}
                        style={{ 
                            position: 'absolute', top: 0, left: 0, right: 0,
                            zIndex: 60000, 
                            display: 'flex', 
                            flexDirection: 'column',
                            padding: '24px 40px 24px 40px', 
                            background: 'linear-gradient(to bottom, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.4) 60%, transparent 100%)',
                            backdropFilter: 'blur(30px) saturate(180%)',
                            borderBottom: `1px solid rgba(255,255,255,0.03)`,
                            opacity: isHudVisible ? 1 : 0,
                            visibility: isHudVisible ? 'visible' : 'hidden',
                            pointerEvents: isHudVisible ? 'auto' : 'none',
                            transform: `translateY(${isHudVisible ? '0' : '-100%'})`,
                            transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s'
                        }}
                    >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'nowrap' }}>
                        {/* 📡 STEALTH LOGO & BADGE (Left) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: -0.5, color: 'white', fontFamily: TOKENS.font, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                BETO<span style={{ opacity: 0.3, fontWeight: 400 }}>.PORTFOLIO</span>
                                <span style={{ fontSize: 8, opacity: 0.5, color: TOKENS.accent, fontWeight: 900, letterSpacing: 2, marginLeft: 5 }}>FORCE_SYNC_v1.1</span>
                            </div>
                            
                            <div style={{ 
                                fontSize: 8, color: TOKENS.accent, fontWeight: 900, letterSpacing: 1.5, 
                                border: `1px solid ${TOKENS.accent}22`, padding: '3px 8px', borderRadius: 40, 
                                background: 'rgba(168, 85, 247, 0.05)', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: TOKENS.accent }} />
                                {String(resumeData?.about?.name || 'BETO').toUpperCase()} // DOSSIER_LOGGED
                            </div>
                        </div>

                        {/* 🕹️ COMMAND CONTROLS (Right) */}
                        <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexShrink: 0 }}>
                            {status !== "IDLE" && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 15 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: TOKENS.accent, animation: 'urb-pulse-dot 1s infinite' }} />
                                    <div style={{ fontSize: 8, color: TOKENS.accent, fontFamily: TOKENS.fontMono, opacity: 0.8 }}>
                                        {status}
                                    </div>
                                </div>
                            )}

                            <div className="urb-hud-strip">
                                <button className="urb-icon-btn" onMouseEnter={() => setHoveredBtn("EXPORT_PDF")} onMouseLeave={() => setHoveredBtn(null)} onClick={() => setExportMode(true)}>
                                    <dc.Icon icon="file-text" style={{ width: 14 }} />
                                    {renderTooltip("EXPORT_PDF")}
                                </button>
                                
                                <button 
                                    className={`urb-icon-btn primary ${isDeploying ? 'active' : ''}`} 
                                    onMouseEnter={() => setHoveredBtn("COMPILE_LOCAL")} onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={handleDeploy}
                                    disabled={isDeploying || isPublishing}
                                >
                                    <dc.Icon icon={isDeploying ? "loader" : "zap"} style={{ width: 14 }} />
                                    {renderTooltip("COMPILE_LOCAL")}
                                </button>

                                <button 
                                    className={`urb-icon-btn ${isPublishing ? 'active' : ''}`} 
                                    onMouseEnter={() => setHoveredBtn("PUB_PLUGIN")} onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={handlePublish}
                                    disabled={isPublishing || isDeploying}
                                >
                                    <dc.Icon icon={isPublishing ? "loader" : "github"} style={{ width: 14 }} />
                                    {renderTooltip("PUB_PLUGIN")}
                                </button>

                                <button 
                                    className={`urb-icon-btn web ${isPublishing ? 'active' : ''}`} 
                                    onMouseEnter={() => setHoveredBtn("PUB_WEB")} onMouseLeave={() => setHoveredBtn(null)}
                                    onClick={handleWebPublish}
                                    disabled={isPublishing || isDeploying}
                                >
                                    <dc.Icon icon={isPublishing ? "loader" : "globe"} style={{ width: 14 }} />
                                    {renderTooltip("PUB_WEB")}
                                </button>

                                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                                <button className={`urb-icon-btn ${showSettings ? 'active' : ''}`} onMouseEnter={() => setHoveredBtn("SETTINGS")} onMouseLeave={() => setHoveredBtn(null)} onClick={() => setShowSettings(!showSettings)}>
                                    <dc.Icon icon="settings" style={{ width: 14 }} />
                                    {renderTooltip("SETTINGS")}
                                </button>

                                <button className="urb-icon-btn danger" onMouseEnter={() => setHoveredBtn("EXIT_SYSTEM")} onMouseLeave={() => setHoveredBtn(null)} onClick={() => {
                                        if (dc?.app?.workspace?.activeLeaf) dc.app.workspace.activeLeaf.detach();
                                        else window.close();
                                    }}>
                                    <dc.Icon icon="log-out" style={{ width: 14 }} />
                                    {renderTooltip("EXIT_SYSTEM")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ⚙️ EXPANDABLE SETTINGS INTERFACE */}
                    <div className={`urb-settings-expanded-wrapper ${showSettings ? 'visible' : ''}`}>
                        <div className="urb-settings-panel">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: TOKENS.accent, letterSpacing: 2 }}>[ SYSTEM_CONFIGURATION ]</div>
                                <dc.Icon 
                                    icon="x" 
                                    style={{ width: 14, color: TOKENS.textDim, cursor: 'pointer' }} 
                                    onClick={() => setShowSettings(false)} 
                                />
                            </div>

                            {/* 🔐 SECTION: GITHUB_AUTH */}
                            <div className="urb-settings-grid">
                                <div className="urb-setting-group">
                                        <div className="urb-setting-label">DEPLOY_REPO_ID</div>
                                        <input className="urb-input" value={repoName} onChange={e => updatePersistent('urb_repo_name', e.target.value, setRepoName)} />
                                </div>
                                <div className="urb-setting-group">
                                        <div className="urb-setting-label">GH_AUTH_TOKEN_ACTIVE</div>
                                        <input className="urb-input" type="password" value={ghToken} onChange={e => updateSecret('urb-github-token', e.target.value, setGhToken)} />
                                </div>
                            </div>

                            <div className="urb-section-divider" />

                            {/* 🧩 SECTION: WEB_INFRASTRUCTURE */}
                            <div className="urb-settings-grid">
                                <div className="urb-setting-group">
                                    <div className="urb-setting-label">OAUTH_CLIENT_ID</div>
                                    <input className="urb-input" value={ghClientId} onChange={e => updatePersistent('urb_gh_client_id', e.target.value, setGhClientId)} />
                                </div>
                                <div className="urb-setting-group">
                                    <div className="urb-setting-label">OAUTH_CLIENT_SECRET</div>
                                    <input className="urb-input" type="password" value={ghClientSecret} onChange={e => updateSecret('urb-gh-client-secret', e.target.value, setGhClientSecret)} />
                                </div>
                                <div className="urb-setting-group">
                                    <div className="urb-setting-label">KEYSTATIC_SECRET</div>
                                    <input className="urb-input" type="password" value={keystaticSecret} onChange={e => updateSecret('urb-keystatic-secret', e.target.value, setKeystaticSecret)} />
                                </div>
                                <div className="urb-setting-group">
                                    <div className="urb-setting-label">G_APP_SLUG</div>
                                    <input className="urb-input" value={ghAppSlug} onChange={e => updatePersistent('urb_gh_app_slug', e.target.value, setGhAppSlug)} />
                                </div>
                            </div>

                            <div className="urb-section-divider" />

                            {/* 🕹️ SECTION: ACTIONS_AND_BRIDGE */}
                            <div style={{ display: 'flex', gap: 20 }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
                                    <button className="urb-act-btn" style={{ 
                                        padding: '12px', 
                                        background: 'rgba(16, 185, 129, 0.05)', 
                                        border: '1px solid #10b98122',
                                        color: '#10b981',
                                        fontSize: 9,
                                        fontWeight: 900,
                                        letterSpacing: 1.5
                                    }} onClick={() => {
                                        const url = `https://github.com/beto-group/${repoName}`;
                                        window.open(url, '_blank');
                                    }}>
                                        <dc.Icon icon="external-link" style={{ width: 10, marginRight: 8 }} />
                                        VISIT_CLASSIFIED_REPOSITORY
                                    </button>

                                    <DeployBridge 
                                        TOKENS={TOKENS} 
                                        isDeploying={isDeploying}
                                        isPublishing={isPublishing}
                                        handleDeploy={handleDeploy}
                                        handlePublish={handlePublish}
                                        logs={logs}
                                        status={status}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <MCPBridge folderPath={folderPath} dc={dc} modules={modules} onReload={() => dc.app.workspace.activeLeaf?.rebuildView?.()} />
                </div>
                </>
            )}
        </div>
    );
}

const _exports = { App };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

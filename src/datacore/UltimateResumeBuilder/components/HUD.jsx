/* ─────────────────────────────────────────────────────────────
   📡 COMPONENT: TACTICAL_HUD (Modular Interface)
   ───────────────────────────────────────────────────────────── */

function HUD({ 
    dc, 
    modules, 
    TOKENS, 
    resumeData, 
    status,
    showSettings,
    setShowSettings,
    isHudVisible,
    showHud,
    hideHud,
    isDeploying,
    isPublishing,
    handleDeploy,
    handlePublish,
    handleWebPublish,
    setExportMode,
    repoName,
    setRepoName,
    ghToken,
    setGhToken,
    ghClientId,
    setGhClientId,
    ghClientSecret,
    setGhClientSecret,
    keystaticSecret,
    setKeystaticSecret,
    ghAppSlug,
    setGhAppSlug,
    updatePersistent,
    updateSecret,
    folderPath,
    logs
}) {
    const { Platform } = modules;
    const { useState } = Platform;
    const [hoveredBtn, setHoveredBtn] = useState(null);
    const { DeployBridge, MCPBridge } = modules;

    const renderTooltip = (label) => {
        if (hoveredBtn !== label) return null;
        return <div className="urb-tooltip-js fade-in">{label}</div>;
    };

    return (
        <>
            {/* 🛰️ HUD HIT-ZONE: Deep detection layer */}
            <div 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, zIndex: TOKENS.Z.HUD_SENSOR, pointerEvents: 'auto' }}
                onMouseEnter={showHud}
            />

            <div 
                id="urb-hud-stack" 
                onMouseEnter={showHud}
                onMouseLeave={() => hideHud()}
                style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0,
                    zIndex: TOKENS.Z.HUD_STACK, 
                    display: 'flex', 
                    flexDirection: 'column',
                    padding: '24px 40px 24px 40px', 
                    background: showSettings ? 'rgba(5,5,8,0.95)' : 'linear-gradient(to bottom, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.4) 60%, transparent 100%)',
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

                    {/* 🛡️ TACTICAL SPACER: Prevent Logo overlap */}
                    <div style={{ flex: 1 }} />

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
                            <button className="urb-icon-btn" onMouseEnter={() => setHoveredBtn("EXPORT_PDF")} onMouseLeave={() => setHoveredBtn(null)} onClick={() => { console.log("[URB] Action: EXPORT_PDF"); setExportMode(true); }}>
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

                            <button className={`urb-icon-btn ${showSettings ? 'active' : ''}`} onMouseEnter={() => setHoveredBtn("SETTINGS")} onMouseLeave={() => setHoveredBtn(null)} onClick={() => { console.log("[URB] Action: TOGGLE_SETTINGS", !showSettings); setShowSettings(!showSettings); }}>
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
                                onClick={() => { console.log("[URB] Action: CLOSE_SETTINGS"); setShowSettings(false); }} 
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
    );
}

const _exports = { HUD };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

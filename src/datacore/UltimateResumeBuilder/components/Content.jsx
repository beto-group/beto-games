// ─────────────────────────────────────────────────────────────
// 🎞️ COMPONENTS: MODULAR CONTENT SYSTEM (Dossier OS Standard)
// ─────────────────────────────────────────────────────────────

function IntroSlide({ dc, data, TOKENS }) {
    return (
        <div className="urb-hero-content fade-in" style={{ position: 'relative', zIndex: 10 }}>
            <div className="urb-hero-tagline">{data?.about?.tagline || "CREATING FACTOTUMS"}</div>
            <div className="urb-hero-name" style={{ fontSize: '12vw', fontWeight: 900, letterSpacing: -10 }}>{data?.about?.name || 'BETO'}</div>
            <div style={{ color: TOKENS.textDim, marginTop: 12 }}>{data?.about?.title || 'Engineer & Technologist'}</div>
        </div>
    );
}

// 🛰️ SUB-COMPONENT: CARD SHELL (The Glass Container)
function CardShell({ children, TOKENS }) {
    return (
        <div className="cinematic-frame fade-in urb-float" style={{
            width: '85%', maxHeight: '82vh', maxWidth: '1200px', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ 
                position: 'relative', width: '100%', height: '100%', 
                background: TOKENS.glassBg, borderRadius: TOKENS.radius, overflow: 'hidden', 
                border: `1px solid ${TOKENS.border}`, 
                boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
                display: 'flex', flexDirection: 'column'
            }}>
                {children}
                {/* Accent Bottom Bar */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, background: TOKENS.accent, opacity: 0.8 }} />
            </div>
        </div>
    );
}

// 🛰️ SUB-COMPONENT: CARD HEADER (High Fidelity Typography)
function CardHeader({ node, TOKENS }) {
    // Dynamic Font Scaling for massive titles (e.g. INFRASTRUCTURE)
    const titleLen = node?.title?.length || 0;
    const fontSize = titleLen > 14 ? 'clamp(32px, 5vw, 42px)' : 'clamp(42px, 8vw, 64px)';
    
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: TOKENS.accent, fontWeight: 900, letterSpacing: 4 }}>ENTRY_TYPE: NODEGRAPH_DATA</div>
                    <div style={{ width: 40, height: 1, background: TOKENS.border }} />
                    <div style={{ fontSize: 9, color: TOKENS.textMuted, fontWeight: 700 }}>VERIFIED_SECURE</div>
                </div>
                
                <h2 style={{ 
                    fontSize: fontSize, 
                    fontWeight: 900, 
                    margin: 0, 
                    letterSpacing: '-0.04em', 
                    lineHeight: 1.05,
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    color: 'white',
                    maxWidth: '95%'
                }}>
                    {node?.title?.toUpperCase()}
                </h2>
                
                <div style={{ 
                    fontSize: 18, 
                    color: TOKENS.textDim, 
                    fontStyle: 'italic', 
                    marginTop: 18, 
                    maxWidth: '90%', 
                    lineHeight: 1.5,
                    fontWeight: 300 
                }}>
                    {node?.desc}
                </div>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: 10, color: TOKENS.textMuted, opacity: 0.6, fontFamily: TOKENS.fontMono, lineSpacing: 1.5 }}>
                <div style={{ color: TOKENS.accent }}>// REF_ID: {node?.id?.toUpperCase()}</div>
                <div>STATUS: ACTIVE_NODE</div>
                <div>TIMESTAMP: {new Date().toISOString().slice(0,10)}</div>
            </div>
        </div>
    );
}

// 🛰️ SUB-COMPONENT: CARD BODY (The Payload)
function CardBody({ node, TOKENS }) {
    if (!node?.bullets) return null;
    
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: 50, marginTop: 'auto' }}>
            {/* Primary Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {node.bullets.slice(0, 3).map((b, i) => (
                    <div key={i} style={{ 
                        fontSize: 17, color: 'white', display: 'flex', gap: 20, 
                        borderLeft: `3px solid ${TOKENS.accent}`, paddingLeft: 24, 
                        lineHeight: 1.5, fontWeight: 400 
                    }}>
                        <span>{b}</span>
                    </div>
                ))}
            </div>
            
            {/* Secondary Metadata Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {node.bullets.slice(3).map((b, i) => (
                    <div key={i} style={{ 
                        fontSize: 13, color: TOKENS.textDim, 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '18px 25px', borderRadius: 12, 
                        lineHeight: 1.4, border: '1px solid rgba(255,255,255,0.05)' 
                    }}>
                        <span style={{ color: TOKENS.accent, marginRight: 8 }}>▹</span>
                        {b}
                    </div>
                ))}
            </div>
        </div>
    );
}

// 🛰️ SUB-COMPONENT: DUAL-PANEL SLIDE (Silent Narrative + Intelligence)
function DualPanelSlide({ node, dc, modules, TOKENS }) {
    const { Platform } = modules;
    const { useEffect, useState, useRef } = Platform;
    const [videoUrl, setVideoUrl] = useState(null);

    useEffect(() => {
        if (node?.panelVideo && window.app) {
            const file = window.app.vault.getFiles().find(f => f.name === node.panelVideo);
            if (file) {
                const url = window.app.vault.getResourcePath(file);
                setVideoUrl(url);
            }
        }
    }, [node?.panelVideo]);

    // Handle generic mission rendering if mission data exists
    const hasMission = !!node.mission;
    const missionParts = node.mission ? node.mission.split('➔').map(s => s.trim()).filter(Boolean) : [];

    // NOTE: This component renders INTEL-ONLY (no media pane).
    // The LEFT panel (media/globe) lives in FloatingScene.jsx.
    // This fills the right intel panel container at 100% width.
    return (
        <div className="urb-intel-pane" key={`intel-${node.id}`} style={{ 
            display: 'flex', flexDirection: 'column', gap: 20, 
            width: '100%', height: '100%', paddingBottom: 40
        }}>
            <div style={{ fontSize: 9, color: TOKENS.accent, fontWeight: 900, letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: TOKENS.accent }} />
                D.q.ACTIVE_SECTOR // REF: {node.id.toUpperCase()}
            </div>
            
            <h2 style={{ fontSize: 38, margin: 0, letterSpacing: -1, lineHeight: 1, color: 'white', fontWeight: 900 }}>
                {node.title.toUpperCase()}
            </h2>
            
            <div style={{ fontSize: 17, lineHeight: 1.6, opacity: 0.85, color: 'white' }}>
                {node.panelText || node.desc}
            </div>

            {hasMission && (
                <div style={{ marginTop: 10, borderTop: '1px solid rgba(168,85,247,0.15)', paddingTop: 20 }}>
                    <div style={{ fontSize: 9, color: TOKENS.accent, fontWeight: 900, letterSpacing: 2, marginBottom: 15 }}>
                        SYSTEM_MISSION_SEQUENCE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {missionParts.map((part, i) => (
                            <div key={i} style={{ fontSize: 15, fontWeight: 600, display: 'flex', gap: 12, color: 'white' }}>
                                <span style={{ color: TOKENS.accent }}>➔</span> {part}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {node.trigger && (
                <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 8, fontFamily: TOKENS.fontMono, color: TOKENS.textMuted }}>TRIGGER_EVENT:</div>
                    <div style={{ fontSize: 9, fontFamily: TOKENS.fontMono, color: TOKENS.accent, fontWeight: 700 }}>{node.trigger.toUpperCase()}</div>
                </div>
            )}
        </div>
    );
}

// 🎭 MAIN Orchestrator: CinematicViewer
function CinematicViewer({ node, TOKENS, dc }) {
    if (!node) return null;

    // Use Dual-Panel layout for slides with video or text panels
    if (node.panelVideo || node.panelText) {
        return <DualPanelSlide node={node} dc={dc} modules={modules} TOKENS={TOKENS} />;
    }
    
    return (
        <CardShell TOKENS={TOKENS}>
            <div style={{ padding: '70px 90px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <CardHeader node={node} TOKENS={TOKENS} />
                <CardBody node={node} TOKENS={TOKENS} />
            </div>
        </CardShell>
    );
}

function PrintLayout({ data, TOKENS, dc, modules }) {
    if (!data) return null;
    const { Platform } = modules;
    const { useMemo } = Platform;
    
    // 🚀 NUCLEAR PERFORMANCE: Memoized data aggregation to prevent HUD lag
    const nodes = data.nodes || [];
    const experience = useMemo(() => nodes.filter(n => n.groupName?.toUpperCase().includes('EXPERIENCE') || n.groupName?.toUpperCase().includes('HISTORY')), [nodes]);
    const projects = useMemo(() => nodes.filter(n => n.groupName?.toUpperCase().includes('SHOWCASE') || n.groupName?.toUpperCase().includes('PROJECTS') || n.groupName?.toUpperCase().includes('RESOURCES')), [nodes]);
    const travels = useMemo(() => nodes.filter(n => n.groupName?.toUpperCase().includes('TRAVEL') || n.groupName?.toUpperCase().includes('NODES')), [nodes]);

    return (
        <div className="urb-print-area urb-print-layout" style={{ 
            width: '100%', padding: '60px', 
            color: 'var(--urb-print-text, white) !important',
            fontFamily: TOKENS.font, display: 'flex', flexDirection: 'column',
            background: 'var(--urb-print-bg, #050508) !important', 
            minHeight: '100vh',
            visibility: 'visible !important'
        }}>
            {/* 🏷️ DOSSIER IDENTITY HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 50, borderBottom: `2px solid rgba(255,255,255,0.08)`, paddingBottom: 30 }}>
                <div>
                    <div style={{ fontSize: 9, color: 'var(--urb-print-accent)', fontWeight: 900, letterSpacing: 6, marginBottom: 12 }}>MASTER_CLASSIFICATION_PROTOCOL://{data.about?.name?.toUpperCase() || 'ANONYMOUS'}</div>
                    <div style={{ fontFamily: TOKENS.fontMono, fontSize: 36, fontWeight: 900, color: 'var(--urb-print-text)', letterSpacing: 2 }}>
                        BETO<span style={{ fontSize: 16, opacity: 0.5, letterSpacing: 8 }}>.PORTFOLIO</span>
                    </div>
                </div>
                
                <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--urb-print-text)', opacity: 0.6, fontFamily: TOKENS.fontMono, lineHeight: 2.0 }}>
                    <div style={{ color: 'var(--urb-print-accent)', fontWeight: 900 }}>[ EXTRACTION_STATUS: READY ]</div>
                    <div>LOC://{data.about?.location?.toUpperCase() || 'UNIDENTIFIED'}</div>
                    <div>DATE://{new Date().toISOString().split('T')[0].toUpperCase()}</div>
                </div>
            </header>

            {/* 📊 TACTICAL DASHBOARD GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 50, flex: 1 }}>
                
                {/* LEFT SILO: Intel & System Specs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    <section>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--urb-print-accent)', marginBottom: 15, letterSpacing: 3, borderLeft: `2px solid var(--urb-print-accent)`, paddingLeft: 10 }}>◆ CORE_IDENTITY</div>
                        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--urb-print-text)', opacity: 0.9, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 2 }}>
                            {data.about?.tagline || "IDENTITY_VERIFIED"}
                        </div>
                    </section>

                    <section>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--urb-print-accent)', marginBottom: 15, letterSpacing: 3, borderLeft: `2px solid var(--urb-print-accent)`, paddingLeft: 10 }}>◆ SYSTEM_SPECS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {['Typescript', 'React', 'Three.js', 'DirectX', 'Vulkan', 'Node.js', 'Architecture'].map(s => (
                                <div key={s} style={{ fontSize: 9, padding: '5px 10px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.1)`, color: 'var(--urb-print-text)', opacity: 0.6, borderRadius: 2 }}>{s.toUpperCase()}</div>
                            ))}
                        </div>
                    </section>

                    <section style={{ marginTop: 'auto' }}>
                        <div style={{ fontSize: 9, fontFamily: TOKENS.fontMono, color: 'var(--urb-print-text)', opacity: 0.4, lineHeight: 2.0 }}>
                            <div>SYSLOG_0X8F: AUTHENTICATED</div>
                            <div>ENCRYPTION: AES-256_STABLE</div>
                            <div>NETWORK: MESH_UP</div>
                            <div>LOC://{data.about?.location?.toUpperCase()}</div>
                        </div>
                    </section>
                </div>

                {/* CENTER SILO: Operational History Log */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--urb-print-accent)', marginBottom: 15, letterSpacing: 3, borderLeft: `2px solid var(--urb-print-accent)`, paddingLeft: 10 }}>◆ OPERATIONAL_HISTORY_LOG</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        {experience.map((it, i) => (
                            <div key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)`, paddingBottom: 25 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--urb-print-text)', letterSpacing: -0.5 }}>{it.title?.toUpperCase()}</div>
                                    <div style={{ fontSize: 10, fontFamily: TOKENS.fontMono, color: 'var(--urb-print-accent)', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: 4 }}>{it.date || "2024_ACTIVE"}</div>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--urb-print-text)', opacity: 0.7, lineHeight: 1.6, marginBottom: 15 }}>{it.desc}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {it.bullets?.slice(0, 4).map((b, j) => (
                                        <div key={j} style={{ fontSize: 12, color: 'var(--urb-print-text)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <span style={{ color: 'var(--urb-print-accent)', fontWeight: 900 }}>▹</span> 
                                            <span style={{ opacity: 0.9 }}>{b.toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SILO: Projects & Travel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    <section>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--urb-print-accent)', marginBottom: 15, letterSpacing: 3, borderLeft: `2px solid var(--urb-print-accent)`, paddingLeft: 10 }}>◆ PROJECT_SHOWCASE</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {projects.map((p, i) => (
                                <div key={p.id || i} style={{ background: 'rgba(168, 85, 247, 0.03)', padding: 15, borderRadius: 4, border: `1px solid rgba(168, 85, 247, 0.15)` }}>
                                    <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6, color: 'var(--urb-print-text)', letterSpacing: 1 }}>{p.title?.toUpperCase()}</div>
                                    <div style={{ fontSize: 10, color: 'var(--urb-print-text)', opacity: 0.6, lineHeight: 1.5 }}>{p.desc?.substring(0, 100)}...</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--urb-print-accent)', marginBottom: 15, letterSpacing: 3, borderLeft: `2px solid var(--urb-print-accent)`, paddingLeft: 10 }}>◆ TRAVEL_CHART</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.01)', padding: 15, borderRadius: 4 }}>
                            {travels.slice(0, 6).map((t, i) => (
                                <div key={i} style={{ fontSize: 10, color: 'var(--urb-print-text)', opacity: 0.4, display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid rgba(255,255,255,0.03)`, paddingBottom: 4 }}>
                                    <span style={{ letterSpacing: 1 }}>{t.title?.toUpperCase()}</span>
                                    <span style={{ color: 'var(--urb-print-accent)', fontFamily: TOKENS.fontMono }}>{t.id?.toUpperCase() || '0X_ACTIVE'}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* 🛡️ DOSSIER FOOTER */}
            <footer style={{ marginTop: 50, paddingTop: 40, borderTop: `2px solid rgba(255,255,255,0.08)`, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--urb-print-text)', opacity: 0.4, fontFamily: TOKENS.fontMono, letterSpacing: 6 }}>
                    END_OF_TRANSMISSION // BETO.portfolio_SECURE_EXTRACT
                </div>
            </footer>
        </div>
    );
}

const _exports = { IntroSlide, CinematicViewer, PrintLayout };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

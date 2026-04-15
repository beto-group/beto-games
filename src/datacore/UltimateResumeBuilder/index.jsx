// ─────────────────────────────────────────────────────────────
// 🚀 BOOTSTRAPPER: ULTIMATE RESUME BUILDER (V5 + SAFE AGENT)
// ─────────────────────────────────────────────────────────────

async function View({ folderPath }) {
    const adapter = dc.app.vault.adapter;

    // 1. Core Safe Agent (Persistent command poll)
    const Agent = {
        timer: null,
        start: (onReload) => {
            if (Agent.timer) clearInterval(Agent.timer);
            const cmdFile = folderPath + '/mcp_commands.json';

            Agent.timer = setInterval(async () => {
                try {
                    if (!(await adapter.exists(cmdFile))) return;
                    const content = await adapter.read(cmdFile);
                    let cmd;
                    try { cmd = JSON.parse(content); } catch (e) { return; }

                    if (cmd && cmd.executed === false) {
                        const SAFE_ACTIONS = ['reload', 'open_settings'];
                        if (SAFE_ACTIONS.includes(cmd.action)) {
                            cmd.executed = true;
                            cmd.result = "Executed by Safe Agent";
                            cmd.executedAt = new Date().toISOString();
                            await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));

                            if (cmd.action === 'reload') onReload();
                            else if (cmd.action === 'open_settings') dc.app.setting.open();
                        }
                    }
                } catch (e) { console.error("[SafeAgent] Error", e); }
            }, 1000);
            return () => clearInterval(Agent.timer);
        }
    };

    const SafeView = () => {
        const [app, setApp] = dc.useState(null);
        const [error, setError] = dc.useState(null);
        const [key, setKey] = dc.useState(0);

        // A. Start Agent
        dc.useEffect(() => {
            return Agent.start(() => {
                if (dc.app.workspace.activeLeaf?.rebuildView) dc.app.workspace.activeLeaf.rebuildView();
                else setKey(k => k + 1);
            });
        }, []);

        // B. Load Main App safely
        dc.useEffect(() => {
            const load = async () => {
                try {
                    const base = "_RESOURCES/DATACORE/142_UltimateResumeBuilder/src";
                    const v = Date.now(); // 🛰️ CACHE_BUSTER: Force DataCore to re-fetch on every mount
                    
                    const [
                        styles, parser, nodeGraph, visuals, content, floatingScene, 
                        deployment, loadScript, appModule, globeModule, hsModule, 
                        timelineModule, adapterModule, bridgeModule
                    ] = await Promise.all([
                        dc.require(`${base}/core/Styles.js`),
                        dc.require(`${base}/core/Parser.js`),
                        dc.require(`${base}/components/NodeGraph.jsx`),
                        dc.require(`${base}/components/Visuals.jsx`),
                        dc.require(`${base}/components/Content.jsx`),
                        dc.require(`${base}/components/FloatingScene.jsx`),
                        dc.require(`${base}/core/Deployment.js`),
                        dc.require(`${base}/core/utils/loadScript.js`),
                        dc.require(`${base}/App.jsx`),
                        dc.require(`${base}/components/TravelGlobeWidget.jsx`),
                        dc.require(`${base}/components/HyperScroll.jsx`),
                        dc.require(`${base}/components/TimelineSlide.jsx`),
                        dc.require(`${base}/core/PlatformAdapter.jsx`),
                        dc.require(`${base}/components/DeployBridge.jsx`)
                    ]);

                    const modules = {
                        ...styles, ...parser, ...nodeGraph, ...visuals, ...content, 
                        ...floatingScene, ...loadScript,
                        Platform: adapterModule.Platform,
                        createAdapter: adapterModule.createAdapter,
                        getDeploymentLogic: deployment.getDeploymentLogic,
                        TravelGlobeWidget: globeModule.TravelGlobeWidget,
                        HyperScroll: hsModule.HyperScroll,
                        TimelineSlide: timelineModule.TimelineSlide,
                        DeployBridge: bridgeModule.DeployBridge,
                        MCPBridge: bridgeModule.MCPBridge
                    };

                    setApp({ Component: appModule.App, modules });
                    setError(null);
                } catch (e) {
                    console.error("[URB Bootstrap] Failed to load modules:", e);
                    setError(e);
                }
            };
            load();
        }, [key]);

        if (error) return (
            <div style={{ padding: '40px', background: '#1a0d0d', color: '#ffaaaa', height: '100%', fontFamily: 'monospace', textAlign: 'center' }}>
                <h2 style={{ color: '#ff5555' }}>SYSTEM_FAILURE: Module Extraction Aborted</h2>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '4px', textAlign: 'left', border: '1px solid #422' }}>
                    <strong>{error.message}</strong>
                    <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '10px' }}>{error.stack}</div>
                </div>
                <p style={{ marginTop: '20px', opacity: 0.8 }}>The Safe Agent is still active. Apply fixes and trigger 'reload' via CLI.</p>
            </div>
        );

        if (!app) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontFamily: 'monospace' }}>INITIALIZING_BOOTSTRAP_PROTOCOL...</div>;

        return <app.Component dc={dc} modules={app.modules} folderPath={folderPath} />;
    };

    return <SafeView />;
}

return { View };

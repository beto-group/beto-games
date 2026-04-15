// ─────────────────────────────────────────────────────────────
// 🖥️ COMPONENT: TACTICAL DEPLOYMENT BRIDGE (Universal Connector)
// ─────────────────────────────────────────────────────────────

function DeployBridge({ TOKENS, isDeploying, isPublishing, handleDeploy, handlePublish, logs, status }) {
    return (
        <div className="deploy-bridge-panel fade-in" style={{
            padding: '20px', background: 'rgba(5,5,8,0.4)', border: `1px solid ${TOKENS.border}44`,
            borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 15
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: TOKENS.accent, fontWeight: 900, letterSpacing: 2 }}>TACTICAL_BRIDGE_v2.0</div>
                <div style={{ fontSize: 8, color: status === 'IDLE' ? TOKENS.textDim : TOKENS.accent, opacity: 0.8 }}>{status}</div>
            </div>
            
            
            <div className="urb-mini-terminal" style={{ 
                height: 100, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', 
                padding: 10, borderRadius: 2, border: `1px solid ${TOKENS.border}22`,
                fontSize: 9, fontFamily: 'monospace', color: TOKENS.textDim
            }}>
                {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} style={{ marginBottom: 4, opacity: i === 0 ? 1 : 0.5 }}>
                        {`> ${log}`}
                    </div>
                )) : (
                    <div style={{ opacity: 0.3 }}>Awaiting packet transmission...</div>
                )}
            </div>
        </div>
    );
}

const _exports = { DeployBridge };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;



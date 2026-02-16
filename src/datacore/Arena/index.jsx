async function View({ STYLES, dc, DatacoreShim, folderPath }) {
    const { useState, useEffect } = dc;

    return function Arena({ gameId = 'iqgame' }) {
        const [showLogic, setShowLogic] = useState(false);

        // Map gameId to Datacore component names
        const gameMap = {
            'iqgame': 'IQGame',
            'mapglobe': 'mapglobe',
            'snake': 'EvolutionEngine'
        };

        const targetComponent = gameMap[gameId] || 'IQGame';

        return (
            <div style={{
                display: 'flex',
                width: '100%',
                height: 'calc(100vh - 100px)',
                gap: '24px',
                padding: '24px',
                boxSizing: 'border-box'
            }}>
                {/* Game Area */}
                <div style={{
                    flex: 1,
                    background: '#000',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <DatacoreShim
                        name={targetComponent}
                        folderPath={folderPath}
                        isInception={true}
                    />
                </div>

                {/* Sidebar */}
                <div style={{
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    <div style={STYLES.glassCard}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '900', letterSpacing: '0.1em' }}>HALL OF FAME</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span style={{ color: '#a1a1aa' }}>#0{i} FACTOTUM_X</span>
                                    <span style={{ fontWeight: '800' }}>{1000 - i * 50}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            onClick={() => setShowLogic(!showLogic)}
                            style={STYLES.ctaButton}
                        >
                            {showLogic ? 'HIDE LOGIC' : 'VIEW LOGIC'}
                        </button>
                        <button
                            style={{ ...STYLES.ctaButton, backgroundColor: 'transparent', color: '#fff', border: '1px solid #fff' }}
                            onClick={() => alert('Forked to Vault!')}
                        >
                            FORK TO VAULT
                        </button>
                    </div>

                    {showLogic && (
                        <div style={{
                            ...STYLES.glassCard,
                            flex: 1,
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: '#4ade80'
                        }}>
                            <pre>
                                {`// Sovereign Logic Shim\n// Component: ${targetComponent}\n\nasync function View() {\n  // Implementation details... \n}`}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    };
}

return { View };

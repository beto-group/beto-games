async function View({ STYLES, dc }) {
    const { useState, useEffect } = dc;

    const data = [
        { type: 'DEPLOY', target: 'N-BACK GAME v2.4', user: 'FACTOTUM_01', time: '2s ago' },
        { type: 'SCORE', target: 'IQ_GAME', score: '134', user: 'BETO_USER', time: '1m ago' },
        { type: 'FORK', target: 'SNAKE_ENGINE', user: 'TINKERER_X', time: '5m ago' },
        { type: 'DEPLOY', target: 'VIDEO_SHIM', user: 'ENGINEER_99', time: '12m ago' },
        { type: 'SCORE', target: 'FLAPPY_BETO', score: '992', user: 'ACE_GAMER', time: '15m ago' },
    ];

    return function LiveTicker() {
        const [offset, setOffset] = useState(0);

        useEffect(() => {
            const timer = setInterval(() => {
                setOffset(prev => (prev + 1) % data.length);
            }, 4000);
            return () => clearInterval(timer);
        }, []);

        return (
            <div style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                overflow: 'hidden',
                position: 'relative',
                maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
            }}>
                <div style={{
                    transform: `translateY(-${offset * 80}px)`,
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {data.map((item, i) => (
                        <div key={i} style={{
                            height: '60px',
                            padding: '12px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            borderLeft: `2px solid ${item.type === 'DEPLOY' ? '#4ade80' : item.type === 'SCORE' ? '#fbbf24' : '#60a5fa'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', letterSpacing: '0.1em' }}>
                                <span>{item.type}</span>
                                <span>{item.time}</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: '#fff' }}>
                                {item.user} <span style={{ fontWeight: '400', color: '#a1a1aa' }}>onto</span> {item.target}
                                {item.score && <span style={{ color: '#fbbf24', marginLeft: '10px' }}>[{item.score}]</span>}
                            </div>
                        </div>
                    ))}
                    {/* Duplicate for infinite feel */}
                    {data.map((item, i) => (
                        <div key={'dup-' + i} style={{
                            height: '60px',
                            padding: '12px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            borderLeft: `2px solid ${item.type === 'DEPLOY' ? '#4ade80' : item.type === 'SCORE' ? '#fbbf24' : '#60a5fa'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', letterSpacing: '0.1em' }}>
                                <span>{item.type}</span>
                                <span>{item.time}</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: '#fff' }}>
                                {item.user} <span style={{ fontWeight: '400', color: '#a1a1aa' }}>onto</span> {item.target}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
}

return { View };

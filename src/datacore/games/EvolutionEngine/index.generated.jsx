"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


async function View({ STYLES, dc }) {
    // Hooks provided by React import

    return function EvolutionEngine() {
        const [stage, setStage] = useState(0); // 0: Snake, 1: Flappy, 2: Dino
        const stages = [
            { id: 'snake', name: 'SNAKE', desc: 'Sovereign Logic', color: '#4ade80' },
            { id: 'flappy', name: 'FLAPPY', desc: 'Event Streams', color: '#fbbf24' },
            { id: 'dino', name: 'DINO', desc: 'Nexus Core', color: '#f87171' }
        ];

        useEffect(() => {
            const timer = setInterval(() => {
                setStage(prev => (prev + 1) % stages.length);
            }, 3000);
            return () => clearInterval(timer);
        }, []);

        return (
            <div style={{
                width: '100%',
                height: '400px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {stages.map((s, i) => (
                    <div key={s.id} style={{
                        position: 'absolute',
                        opacity: stage === i ? 1 : 0,
                        transform: `scale(${stage === i ? 1 : 0.8})`,
                        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '120px',
                            fontWeight: '900',
                            color: s.color,
                            opacity: 0.1,
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 0,
                            letterSpacing: '-0.1em'
                        }}>
                            {s.name}
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <h2 style={{ fontSize: '48px', fontWeight: '900', margin: 0 }}>{s.name}</h2>
                            <p style={{ color: '#a1a1aa', fontSize: '18px', marginTop: '10px' }}>{s.desc}</p>
                        </div>
                    </div>
                ))}

                <div style={{
                    position: 'absolute',
                    bottom: '30px',
                    display: 'flex',
                    gap: '12px'
                }}>
                    {stages.map((_, i) => (
                        <div key={i} style={{
                            width: '40px',
                            height: '4px',
                            background: stage === i ? '#fff' : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>
            </div>
        );
    };
}

export {  View  };
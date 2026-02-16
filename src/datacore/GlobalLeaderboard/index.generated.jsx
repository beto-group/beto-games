"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


async function View({ STYLES, dc }) {
    return function GlobalLeaderboard() {
        const ranks = [
            { rank: 1, name: 'FACTOTUM_ZERO', game: 'IQ_GAME', credits: 4850 },
            { rank: 2, name: 'LOGIC_BENDER', game: 'N_BACK', credits: 4200 },
            { rank: 3, name: 'VOID_WALKER', game: 'SNAKE_ENGINE', credits: 3950 },
            { rank: 4, name: 'NEXUS_PRIME', game: 'IQ_GAME', credits: 3800 },
            { rank: 5, name: 'BETO_USER_1', game: 'FLAPPY_BETO', credits: 3500 },
        ];

        return (
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '40px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            <th style={{ padding: '16px', textAlign: 'left' }}>RANK</th>
                            <th style={{ padding: '16px', textAlign: 'left' }}>FACTOTUM</th>
                            <th style={{ padding: '16px', textAlign: 'left' }}>GAME</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>CREDITS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranks.map(item => (
                            <tr key={item.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '24px 16px', fontWeight: '900' }}>#{item.rank < 10 ? '0' + item.rank : item.rank}</td>
                                <td style={{ padding: '24px 16px' }}>{item.name}</td>
                                <td style={{ padding: '24px 16px', color: '#a1a1aa' }}>{item.game}</td>
                                <td style={{ padding: '24px 16px', textAlign: 'right', fontWeight: '800' }}>{item.credits}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };
}

export {  View  };
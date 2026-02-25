"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as utils_mod from '../utils/scoreManager.generated.jsx';

function IQGame({ styles, useIQGame, saveSession, getStats, resetStats, folderPath, onToggleFullTab, isFullTab, isInception = false }) {
    const localDc = typeof dc !== 'undefined' ? dc : (typeof window !== 'undefined' ? window.dc : null);
    // Hooks provided by React import
    const {
        gameState, currentN, setCurrentN,
        currentInterval, setCurrentInterval,
        sequence, currentIndex, showStimulus,
        activeKeys,
        score, lastAccuracy, dPrime, progression,
        startRound, checkMatch, quitGame
    } = useIQGame({ initialN: 1, initialInterval: 3000, roundLength: 22, saveSession });

    const currentStep = sequence[currentIndex] || {};
    const [viewMode, setViewMode] = useState('main'); // main, custom

    const [showTutorial, setShowTutorial] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // --- Extracting Overlays and Charts outside main component for performance & best practices ---








    const initAudio = () => {
        if (typeof window === 'undefined') return;

        // 1. Web Audio Unlock (Universal)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') ctx.resume();
                // Create & play a micro-silent buffer
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);
            }
        } catch (e) {
            console.warn("AudioContext unlock failed", e);
        }

        // 2. Speech Synthesis Unlock (iOS Safari Specific)
        if (window.speechSynthesis) {
            // Force load voices
            window.speechSynthesis.getVoices();

            // Audible priming (silent utterance often fails to unlock async loops on iOS)
            const utterance = new SpeechSynthesisUtterance(" ");
            utterance.volume = 0.01; // Low but non-zero
            utterance.rate = 10;     // Extremely fast
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleStartTraining = () => {
        initAudio();
        setCurrentN(1);
        setCurrentInterval(3000);
        startRound();
    };

    const handleStartCustom = () => {
        initAudio();
        startRound();
    };

    const handleNextRound = () => {
        initAudio();
        startRound();
    };

    return (
        <div style={styles.container}>
            {/* Overlays are moved to the end of the file or handled at the end of the return block */}

            <style>{`
                body, html {
                    overflow: hidden !important;  /* Kill ALL page scroll while game is mounted */
                    overscroll-behavior: none !important;
                }
                .iq-summary-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .iq-summary-icon svg.svg-icon {
                    width: 80px !important;
                    height: 80px !important;
                }
                .iq-btn-icon {
                    display: inline-flex;
                    align-items: center;
                    margin-right: 12px;
                }
                .iq-btn-icon svg.svg-icon {
                    width: 24px !important;
                    height: 24px !important;
                }
                .iq-main-btn {
                    transition: all 0.3s ease !important;
                }
                .iq-main-btn:hover {
                    transform: scale(1.05);
                    background: rgba(138, 43, 226, 0.25) !important;
                    box-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
                }
                .iq-game-btn:hover {
                    background: rgba(138, 43, 226, 0.3) !important;
                    border-color: #8a2be2 !important;
                    box-shadow: 0 0 15px rgba(138, 43, 226, 0.4);
                }
                .iq-game-btn:active {
                    transform: scale(0.95);
                }
            `}</style>
            {/* HUD */}
            {gameState === 'playing' && (
                <div style={styles.stats}>
                    <div>LEVEL <span style={styles.statValue}>{currentN}</span></div>
                </div>
            )}

            {/* Exit Button during game */}
            {gameState === 'playing' && (
                <div
                    onClick={quitGame}
                    style={{
                        position: 'absolute',
                        top: 'clamp(10px, 3vw, 40px)',
                        right: 'clamp(10px, 3vw, 40px)',
                        cursor: 'pointer',
                        padding: 'clamp(6px, 2vw, 12px) clamp(12px, 4vw, 24px)',
                        borderRadius: '6px',
                        background: 'rgba(255, 77, 77, 0.2)',
                        border: '1px solid rgba(255, 77, 77, 0.4)',
                        color: '#ff4d4d',
                        fontSize: 'clamp(10px, 2.5vw, 14px)',
                        letterSpacing: '0.1em',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 100
                    }}
                >
                    <dc.Icon icon="x" style={{ width: '16px', height: '16px' }} />
                    EXIT
                </div>
            )}

            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(16px, 4vh, 40px) 16px',
                boxSizing: 'border-box',
            }}>
                {gameState === 'idle' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 'clamp(12px, 2.5vh, 24px)' }}>
                        <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: 'clamp(8px, 2vh, 24px)' }}>
                            <h1 style={{ ...styles.title }}>IQ GAME</h1>
                            <p style={{ ...styles.subtitle }}>DUAL N-BACK MEMORY TRAINING</p>
                        </div>

                        {viewMode === 'main' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vh, 16px)', alignItems: 'center', width: '100%', flexShrink: 0 }}>
                                <button
                                    className="iq-main-btn"
                                    style={{ ...styles.button, ...styles.buttonPrimary }}
                                    onClick={handleStartTraining}
                                >
                                    START TRAINING
                                </button>
                                <button
                                    className="iq-main-btn"
                                    style={{ ...styles.button, ...styles.buttonSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    onClick={() => setShowTutorial(true)}
                                >
                                    <dc.Icon icon="help-circle" size={16} />
                                    HOW TO PLAY
                                </button>
                                <button
                                    className="iq-main-btn"
                                    style={{ ...styles.button, ...styles.buttonSecondary }}
                                    onClick={() => setViewMode('custom')}
                                >
                                    CUSTOM MODE
                                </button>
                                <button
                                    className="iq-main-btn"
                                    onClick={() => setShowStats(true)}
                                    style={{
                                        ...styles.button,
                                        ...styles.buttonSecondary,
                                        background: 'rgba(138, 43, 226, 0.15)',
                                        border: '1px solid rgba(138, 43, 226, 0.4)',
                                        color: '#d8b4fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <dc.Icon icon="bar-chart-2" size={16} />
                                    VIEW STATS
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(20px, 3vh, 36px)', width: '100%', flexShrink: 0 }}>
                                <div style={{ display: 'flex', gap: 'clamp(24px, 8vmin, 80px)', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: 'clamp(10px, 1.5vmin, 13px)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>N LEVEL</div>
                                        <div style={styles.selector}>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentN(Math.max(1, currentN - 1))}>-</button>
                                            <div style={styles.nValue}>{currentN}</div>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentN(Math.min(9, currentN + 1))}>+</button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: 'clamp(10px, 1.5vmin, 13px)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>INTERVAL (S)</div>
                                        <div style={styles.selector}>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentInterval(Math.max(500, currentInterval - 500))}>-</button>
                                            <div style={{ ...styles.nValue, width: '64px' }}>{(currentInterval / 1000).toFixed(1)}</div>
                                            <button style={styles.selectorBtn} onClick={() => setCurrentInterval(Math.min(10000, currentInterval + 500))}>+</button>
                                        </div>
                                    </div>
                                </div>
                                <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={handleStartCustom}>
                                    START SESSION
                                </button>
                                <button
                                    style={{ ...styles.button, ...styles.buttonSecondary, border: 'none', background: 'transparent', opacity: 0.6 }}
                                    onClick={() => setViewMode('main')}
                                >
                                    ← BACK
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={styles.grid}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                            const isActive = showStimulus && currentStep.pos === i;
                            if (i === 4) return <div key={i} style={styles.cell} />;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.cell,
                                        ...(isActive ? styles.cellActive : {})
                                    }}
                                />
                            );
                        })}
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={{
                        ...styles.controls,
                        position: 'relative',
                        zIndex: 2000,
                        marginTop: 'clamp(12px, 3vh, 24px)', // Reduced margin
                        display: 'flex',
                        gap: 'clamp(10px, 4vw, 32px)',
                        pointerEvents: 'auto',
                        paddingBottom: 'clamp(10px, 3vh, 20px)',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        justifyContent: 'center'
                    }}>
                        <div
                            className="iq-game-btn"
                            style={{
                                ...styles.button,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                                width: 'min(90%, 240px)',
                                flexShrink: 0,
                                margin: '0',
                                border: activeKeys.pos
                                    ? '2px solid #8a2be2'
                                    : '1px solid rgba(255,255,255,0.1)',
                                background: activeKeys.pos
                                    ? 'rgba(138, 43, 226, 0.45)'
                                    : 'rgba(255,255,255,0.04)',
                                color: activeKeys.pos ? '#fff' : 'rgba(255,255,255,0.45)',
                                boxShadow: activeKeys.pos
                                    ? '0 0 24px rgba(138, 43, 226, 0.5), inset 0 0 12px rgba(138, 43, 226, 0.2)'
                                    : 'none',
                                transform: activeKeys.pos ? 'scale(0.97)' : 'scale(1)',
                                transition: 'all 0.12s ease'
                            }}
                            onPointerDown={(e) => { e.preventDefault(); checkMatch('pos'); }}
                            onClick={(e) => { e.preventDefault(); checkMatch('pos'); }}
                        >
                            <span className="iq-btn-icon" style={{ color: 'inherit' }}>
                                <dc.Icon icon="eye" />
                            </span>
                            POSITION (A)
                        </div>
                        <div
                            className="iq-game-btn"
                            style={{
                                ...styles.button,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                                width: 'min(90%, 240px)',
                                flexShrink: 0,
                                margin: '0',
                                border: activeKeys.sound
                                    ? '2px solid #8a2be2'
                                    : '1px solid rgba(255,255,255,0.1)',
                                background: activeKeys.sound
                                    ? 'rgba(138, 43, 226, 0.45)'
                                    : 'rgba(255,255,255,0.04)',
                                color: activeKeys.sound ? '#fff' : 'rgba(255,255,255,0.45)',
                                boxShadow: activeKeys.sound
                                    ? '0 0 24px rgba(138, 43, 226, 0.5), inset 0 0 12px rgba(138, 43, 226, 0.2)'
                                    : 'none',
                                transform: activeKeys.sound ? 'scale(0.97)' : 'scale(1)',
                                transition: 'all 0.12s ease'
                            }}
                            onPointerDown={(e) => { e.preventDefault(); checkMatch('sound'); }}
                            onClick={(e) => { e.preventDefault(); checkMatch('sound'); }}
                        >
                            <span className="iq-btn-icon" style={{ color: 'inherit' }}>
                                <dc.Icon icon="volume-2" />
                            </span>
                            AUDIO (;)
                        </div>
                    </div>
                )}



                {gameState === 'summary' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '400px', gap: '48px' }}>
                        <div style={{ width: '100%', maxWidth: '550px', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff', minWidth: '300px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: 'clamp(10px, 3vw, 20px)' }}>
                                            <span className="iq-summary-icon" style={{ color: '#8a2be2' }}>
                                                <dc.Icon icon="eye" />
                                            </span>
                                        </th>
                                        <th style={{ padding: 'clamp(10px, 3vw, 20px)' }}></th>
                                        <th style={{ padding: 'clamp(10px, 3vw, 20px)' }}>
                                            <span className="iq-summary-icon" style={{ color: '#8a2be2' }}>
                                                <dc.Icon icon="volume-2" />
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody style={{ textAlign: 'center' }}>
                                    <tr style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>
                                        <td style={{ padding: '12px' }}>{score.pos.hits}</td>
                                        <td style={{ padding: '12px', fontWeight: '700', fontSize: 'clamp(1.1rem, 5vw, 1.4rem)', letterSpacing: '0.1em' }}>HITS</td>
                                        <td style={{ padding: '12px' }}>{score.sound.hits}</td>
                                    </tr>
                                    <tr style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: 'rgba(255,255,255,0.4)' }}>
                                        <td style={{ padding: '12px' }}>{score.pos.misses}</td>
                                        <td style={{ padding: '12px', fontWeight: '700', fontSize: 'clamp(1.1rem, 5vw, 1.4rem)', letterSpacing: '0.1em' }}>MISSES</td>
                                        <td style={{ padding: '12px' }}>{score.sound.misses}</td>
                                    </tr>
                                    <tr style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)', color: 'rgba(255,255,255,0.2)' }}>
                                        <td style={{ padding: '12px' }}>{score.pos.falseAlarms}</td>
                                        <td style={{ padding: '12px', fontWeight: '700', fontSize: 'clamp(1.1rem, 5vw, 1.4rem)', letterSpacing: '0.1em' }}>FALSE ALARMS</td>
                                        <td style={{ padding: '12px' }}>{score.sound.falseAlarms}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                fontSize: 'clamp(2.5rem, 12vw, 4.5rem)',
                                fontWeight: '700',
                                color: progression === 'up' ? '#00ff88' : progression === 'down' ? '#ff4d4d' : '#ffffff',
                                lineHeight: '1',
                                position: 'relative',
                                display: 'inline-block'
                            }}>
                                N = {currentN}
                                <div style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    right: '-50px',
                                    fontSize: 'clamp(0.8rem, 3vw, 1rem)',
                                    fontWeight: '600',
                                    color: progression === 'up' ? '#00ff88' : progression === 'down' ? '#ff4d4d' : '#ffffff',
                                    whiteSpace: 'nowrap'
                                }}>
                                    d' = {dPrime}%
                                </div>
                            </div>
                            <div style={{ ...styles.subtitle, marginTop: '8px', color: '#ffffff', fontSize: 'clamp(0.9rem, 4vw, 1.1rem)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                {progression === 'up' ? 'LEVEL UP' : progression === 'down' ? 'LEVEL DOWN' : 'STAYING'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                            <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={handleNextRound}>
                                NEXT ROUND
                            </button>
                            <button style={{ ...styles.button, border: 'none', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontSize: '0.7rem' }} onClick={() => { quitGame(); setViewMode('main'); }}>
                                EXIT
                            </button>
                        </div>
                    </div>
                )}
            </div>



            {showTutorial && (
                <TutorialOverlay
                    styles={styles}
                    setShowTutorial={setShowTutorial}
                    localDc={localDc}
                />
            )}
            {showStats && (
                <StatsOverlay
                    styles={styles}
                    getStats={getStats}
                    resetStats={resetStats}
                    folderPath={folderPath}
                    setShowStats={setShowStats}
                    localDc={localDc}
                />
            )}
        </div>
    );
}

// --- Level History Chart Component ---
const LevelHistoryChart = ({ sessions, styles }) => {
    if (!sessions || sessions.length === 0) return null;

    // Show all sessions
    const data = sessions;
    if (data.length === 0) return null;

    const width = 600;
    const height = clamp(150, 40 * maxN, 200);
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxN = Math.max(...data.map(s => s.nLevel), 3); // Min max is 3 for scale
    const minN = 1;

    const getX = (index) => {
        if (data.length <= 1) return padding.left + chartWidth / 2;
        return padding.left + (index / (data.length - 1)) * chartWidth;
    };
    const getY = (n) => padding.top + chartHeight - ((n - minN) / (maxN - minN)) * chartHeight;

    // Generate Path
    let pathD = '';
    if (data.length > 1) {
        pathD = `M ${getX(0)} ${getY(data[0].nLevel)}`;
    }
    data.forEach((s, i) => {
        if (i === 0) return;
        const x = getX(i);
        const y = getY(s.nLevel);
        const prevX = getX(i - 1);
        const prevY = getY(data[i - 1].nLevel);

        const cp1x = prevX + (x - prevX) / 2;
        const cp1y = prevY;
        const cp2x = prevX + (x - prevX) / 2;
        const cp2y = y;

        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    });

    let fillPathD = '';
    if (data.length > 1) {
        fillPathD = pathD + ` L ${getX(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
    }

    return (
        <div style={{ width: '100%', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px' }}>
            <h3 style={{ ...styles.subtitle, marginBottom: '16px', fontSize: '13px', textAlign: 'center' }}>LEVEL HISTORY</h3>
            <svg width="100%" height="auto" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', width: '100%', display: 'block' }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0, 255, 255, 0.4)" />
                        <stop offset="100%" stopColor="rgba(0, 255, 255, 0)" />
                    </linearGradient>
                </defs>
                {[...Array(maxN - minN + 1)].map((_, i) => {
                    const level = minN + i;
                    const y = getY(level);
                    return <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                })}
                <path d={fillPathD} fill="url(#chartGradient)" />
                <path d={pathD} fill="none" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((s, i) => <circle key={i} cx={getX(i)} cy={getY(s.nLevel)} r="4" fill="#00ffff" stroke="#000" strokeWidth="1" />)}
                {[...Array(maxN - minN + 1)].map((_, i) => {
                    const level = minN + i;
                    return <text key={i} x={padding.left - 10} y={getY(level) + 4} fill="rgba(255,255,255,0.5)" fontSize="12" textAnchor="end">{level}</text>;
                })}
            </svg>
        </div>
    );
};

// --- Reaction Time Chart Component ---
const ReactionTimeChart = ({ sessions, styles }) => {
    if (!sessions || sessions.length === 0) return null;

    const levelGroups = {};
    sessions.forEach(s => {
        const n = s.nLevel;
        if (!levelGroups[n]) levelGroups[n] = { pos: [], sound: [] };
        if (s.score.reactionTimes) {
            if (s.score.reactionTimes.pos) levelGroups[n].pos.push(...s.score.reactionTimes.pos);
            if (s.score.reactionTimes.sound) levelGroups[n].sound.push(...s.score.reactionTimes.sound);
        }
    });

    const activeLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    if (activeLevels.length === 0) return null;

    const averages = activeLevels.map(n => ({
        n,
        posAvg: levelGroups[n].pos.reduce((a, b) => a + b, 0) / (levelGroups[n].pos.length || 1),
        soundAvg: levelGroups[n].sound.reduce((a, b) => a + b, 0) / (levelGroups[n].sound.length || 1)
    }));

    const width = 600;
    const height = 250;
    const padding = { top: 40, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = 30;

    const yMax = Math.max(...averages.map(a => Math.max(a.posAvg, a.soundAvg))) * 1.2 || 1000;

    return (
        <div style={{ width: '100%', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px' }}>
            <h3 style={{ ...styles.subtitle, marginBottom: '24px', fontSize: '13px', textAlign: 'center' }}>REACTION TIME (MS)</h3>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#9d50bb' }}></div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Visual</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#4dff88' }}></div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Auditory</div>
                </div>
            </div>
            <svg width="100%" height="auto" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', width: '100%', display: 'block' }}>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding.top + chartHeight - (chartHeight * ratio);
                    return (
                        <g key={ratio}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" />
                            <text x={padding.left - 10} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">{Math.round(yMax * ratio)}</text>
                        </g>
                    );
                })}
                {averages.map((d, i) => {
                    const xCenter = padding.left + (chartWidth / (averages.length + 1)) * (i + 1);
                    const xPos = xCenter - 5 - barWidth;
                    const xSound = xCenter + 5;
                    const hPos = (d.posAvg / yMax) * chartHeight;
                    const hSound = (d.soundAvg / yMax) * chartHeight;
                    return (
                        <g key={d.n}>
                            <rect x={xPos} y={padding.top + chartHeight - hPos} width={barWidth} height={hPos} fill="#9d50bb" opacity="0.8" />
                            <rect x={xSound} y={padding.top + chartHeight - hSound} width={barWidth} height={hSound} fill="#4dff88" opacity="0.8" />
                            <text x={xCenter} y={height - 10} fill="white" fontSize="12" textAnchor="middle">N-{d.n}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- Statistics Overlay Component ---
const StatsOverlay = ({ styles, getStats, resetStats, folderPath, setShowStats, localDc }) => {
    // Hooks provided by React import
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [historyView, setHistoryView] = useState('graph');
    const [confirmReset, setConfirmReset] = useState(false);

    const handleReset = async () => {
        if (!confirmReset) { setConfirmReset(true); return; }
        let resetFn = resetStats;
        if (typeof resetFn !== 'function' && folderPath) {
            try {
                const utils = utils_mod; // (lifted to top-level import)
                if (utils && typeof utils.resetStats === 'function') resetFn = utils.resetStats;
            } catch (e) { console.error("Failed to load scoreManager dynamically", e); }
        }
        if (typeof resetFn === 'function') {
            try {
                const empty = await resetFn();
                if (empty) { setStats(empty); setConfirmReset(false); }
            } catch (e) { console.error("Reset failed:", e); }
        }
    };

    useEffect(() => {
        if (typeof getStats === 'function') {
            getStats().then(data => { setStats(data); setLoading(false); }).catch(err => { console.error("getStats failed:", err); setLoading(false); });
        } else { setLoading(false); }
    }, []);

    if (loading) return (
        <div style={styles.tutorialOverlay}>
            <div style={{ ...styles.title, fontSize: '24px' }}>LOADING...</div>
        </div>
    );

    const overall = stats?.overall || { gamesPlayed: 0, totalHits: 0, totalMisses: 0, totalFalseAlarms: 0 };
    const sessions = stats?.sessions || [];
    const recentSessions = [...sessions].reverse().slice(0, 10);

    return (
        /* Full-screen backdrop */
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
        }}>
            {/* Modal card */}
            <div style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: '85vh',
                background: 'rgba(8,8,8,0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}>
                {/* Fixed header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '900', letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase' }}>STATISTICS</h2>
                    <div
                        onClick={() => setShowStats(false)}
                        style={{ cursor: 'pointer', padding: '8px 20px', borderRadius: '50px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', userSelect: 'none' }}
                    >
                        CLOSE
                    </div>
                </div>

                {/* Scrollable body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', WebkitOverflowScrolling: 'touch' }}>
                    {/* Overview stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', marginBottom: '24px' }}>
                        {[
                            { label: 'GAMES', value: overall.gamesPlayed, color: '#fff' },
                            { label: 'HITS', value: overall.totalHits, color: '#4dff88' },
                            { label: 'MISSES', value: overall.totalMisses, color: '#ff4d4d' },
                            { label: 'FALSE ALARMS', value: overall.totalFalseAlarms, color: '#ffaa4d' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 4px' }}>
                                <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '900', color }}>{value}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Reaction time chart */}
                    <ReactionTimeChart sessions={sessions} styles={styles} />

                    {/* Session history toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', marginTop: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '700' }}>SESSION HISTORY</h3>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => setHistoryView('graph')} style={{ ...styles.button, width: 'auto', padding: '4px 10px', fontSize: '11px', opacity: historyView === 'graph' ? 1 : 0.4, background: historyView === 'graph' ? 'rgba(138,43,226,0.4)' : 'transparent', border: '1px solid rgba(138,43,226,0.4)' }}>GRAPH</button>
                            <button onClick={() => setHistoryView('list')} style={{ ...styles.button, width: 'auto', padding: '4px 10px', fontSize: '11px', opacity: historyView === 'list' ? 1 : 0.4, background: historyView === 'list' ? 'rgba(138,43,226,0.4)' : 'transparent', border: '1px solid rgba(138,43,226,0.4)' }}>LIST</button>
                        </div>
                    </div>

                    {historyView === 'graph' ? (
                        <div style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {sessions.length > 0 ? <LevelHistoryChart sessions={sessions} styles={styles} /> : <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No sessions yet.</div>}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {recentSessions.length === 0 && <div style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontSize: '13px' }}>No sessions yet.</div>}
                            {recentSessions.map((s, i) => {
                                const date = new Date(s.timestamp).toLocaleDateString() + ' ' + new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const accuracy = Math.round(((s.score.pos.hits + s.score.sound.hits) / Math.max(1, (s.score.pos.hits + s.score.pos.misses + s.score.sound.hits + s.score.sound.misses))) * 100);
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{date}</div>
                                        <div style={{ fontWeight: '700', fontSize: '13px' }}>N-{s.nLevel}</div>
                                        <div style={{ color: accuracy > 80 ? '#4dff88' : '#fff', fontSize: '13px', fontWeight: '600' }}>{accuracy}% Acc</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Fixed footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <div
                        onClick={handleReset}
                        style={{
                            cursor: 'pointer', padding: '10px 28px', borderRadius: '8px',
                            background: confirmReset ? 'rgba(255,0,0,0.2)' : 'transparent',
                            border: confirmReset ? '1px solid rgba(255,0,0,0.7)' : '1px solid rgba(255,77,77,0.2)',
                            color: confirmReset ? '#ff4d4d' : 'rgba(255,77,77,0.4)',
                            fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {confirmReset ? "SURE? CLICK TO WIPE ALL DATA" : "RESET ALL DATA"}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Tutorial Overlay Component ---
const TutorialOverlay = ({ styles, setShowTutorial, localDc }) => {
    // Hooks provided by React import
    const [step, setStep] = useState(0);
    const steps = [
        { pos: 0, char: 'A', match: null },
        { pos: 4, char: 'L', match: null },
        { pos: 0, char: 'Q', match: 'pos' },
        { pos: 7, char: 'L', match: 'sound' },
    ];

    useEffect(() => {
        const interval = setInterval(() => { setStep(s => (s + 1) % steps.length); }, 2000);
        return () => clearInterval(interval);
    }, []);

    const currentStep = steps[step];

    return (
        <div style={{
            ...styles.tutorialOverlay,
            justifyContent: 'space-between',
            overflow: 'hidden',
            padding: 'min(5vh, 32px) 20px min(4vh, 24px)',
        }}>
            {/* Header */}
            <h2 style={{
                margin: 0,
                fontSize: 'clamp(16px, 4vw, 22px)',
                fontWeight: '900',
                letterSpacing: '0.15em',
                color: '#fff',
                textAlign: 'center',
                flexShrink: 0
            }}>HOW TO PLAY</h2>

            {/* Demo Grid */}
            <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 16px)', justifyContent: 'center', alignItems: 'flex-end', flexShrink: 0, padding: '0 8px' }}>
                {steps.map((s, i) => {
                    const isCurrent = i === step;
                    const isPrev = i === (step - 2 + steps.length) % steps.length && step >= 2;
                    const opacity = isCurrent || isPrev ? 1 : 0.2;
                    const gridSize = 'clamp(40px, 11vw, 60px)';
                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity, transform: isCurrent ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.3s ease' }}>
                            <div style={{ width: gridSize, height: gridSize, border: `2px solid ${isCurrent ? '#fff' : isPrev ? '#00ff88' : 'rgba(255,255,255,0.15)'}`, background: isCurrent && s.match === 'pos' ? 'rgba(0,255,136,0.15)' : 'transparent', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '2px', borderRadius: '6px', marginBottom: '4px' }}>
                                {[...Array(9)].map((_, idx) => <div key={idx} style={{ background: s.pos === idx ? '#fff' : 'rgba(255,255,255,0.08)', borderRadius: '1.5px' }} />)}
                            </div>
                            <div style={{ fontSize: 'clamp(12px, 3vw, 16px)', fontWeight: '700', color: isCurrent && s.match === 'sound' ? '#00ff88' : 'rgba(255,255,255,0.6)' }}>{s.char}</div>
                        </div>
                    );
                })}
            </div>

            {/* Status indicator */}
            <div style={{ textAlign: 'center', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {currentStep.match === 'pos' ? (
                    <div style={{ color: '#00ff88', fontWeight: '900', fontSize: 'clamp(15px, 4vw, 20px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <dc.Icon icon="eye" style={{ width: '20px', height: '20px' }} /> SAME PLACE?
                    </div>
                ) : currentStep.match === 'sound' ? (
                    <div style={{ color: '#00ff88', fontWeight: '900', fontSize: 'clamp(15px, 4vw, 20px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <dc.Icon icon="volume-2" style={{ width: '20px', height: '20px' }} /> SAME SOUND?
                    </div>
                ) : (
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 'clamp(11px, 3vw, 14px)', letterSpacing: '0.2em', fontWeight: '700' }}>WATCH & LISTEN</div>
                )}
            </div>

            {/* Controls Info */}
            <div style={{
                width: '100%',
                maxWidth: '340px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: 'clamp(10px, 2vh, 16px) 16px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(138,43,226,0.25)', border: '1px solid #8a2be2', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>TAP L</div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Match Position</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(138,43,226,0.25)', border: '1px solid #8a2be2', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>TAP R</div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Match Sound</span>
                </div>
            </div>

            {/* GOT IT Button */}
            <div
                onClick={() => setShowTutorial(false)}
                style={{
                    padding: '14px 48px',
                    background: '#8a2be2',
                    borderRadius: '50px',
                    color: '#fff',
                    fontSize: 'clamp(13px, 3.5vw, 16px)',
                    fontWeight: '900',
                    letterSpacing: '0.25em',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(138,43,226,0.45)',
                    textTransform: 'uppercase',
                    flexShrink: 0
                }}
            >
                GOT IT!
            </div>
        </div>
    );
};

export {  IQGame  };
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


function HeroSection({ dc, STYLES, useRetroEngine, setCurrentPage }) {
    // Hooks provided by React import
    const canvasRef = useRef(null);
    const renderLoopRef = useRef(null);
    const particlesRef = useRef([]);
    const [nameInput, setNameInput] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Initialize Engine
    const [isEditingName, setIsEditingName] = useState(false);
    const [isHoveringStart, setIsHoveringStart] = useState(false);
    const [isHoveringOther, setIsHoveringOther] = useState(false);
    const [isHoveringLeaderboard, setIsHoveringLeaderboard] = useState(false);
    const [isHoveringAbout, setIsHoveringAbout] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isHoveringAck, setIsHoveringAck] = useState(false);
    const [showInGameTutorial, setShowInGameTutorial] = useState(null); // 'snake', 'flappy', 'cat'
    const [tutorialStatus, setTutorialStatus] = useState('hidden'); // 'hidden', 'entering', 'exiting'
    const [isTouch, setIsTouch] = useState(false);
    const sessionSeenRef = useRef(new Set());

    // Initialize Engine
    const {
        stateRef,
        gameState,
        gameMode,
        score,
        highScore,
        username,
        setUsername,
        leaderboard,
        isLoadingLeaderboard,
        totalGames,
        totalPlayers,
        registerUser,
        startGame,
        isPlayerInUIZone,
        playerPos,
        latestScoreValue,
        isServerOffline,
        pendingScores,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        GRID_SIZE
    } = useRetroEngine(dc);

    useEffect(() => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    // Tutorial Logic (Cinematic Session-based)
    useEffect(() => {
        if (gameState === 'playing' && gameMode) {
            if (!sessionSeenRef.current.has(gameMode)) {
                setShowInGameTutorial(gameMode);
                setTutorialStatus('entering');
                sessionSeenRef.current.add(gameMode);

                // Retract after 6s
                const retractTimer = setTimeout(() => {
                    setTutorialStatus('exiting');
                    // Fully hide after animation completes (0.8s)
                    setTimeout(() => {
                        setShowInGameTutorial(null);
                        setTutorialStatus('hidden');
                    }, 800);
                }, 6000);

                return () => clearTimeout(retractTimer);
            }
        } else if (gameState === 'menu' || gameState === 'gameOver') {
            sessionSeenRef.current.clear();
            setShowInGameTutorial(null);
            setTutorialStatus('hidden');
        } else {
            setShowInGameTutorial(null);
            setTutorialStatus('hidden');
        }
    }, [gameState, gameMode]);

    const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01";

    // --- HD UTILS ---
    const drawBloomChar = (ctx, char, x, y, size, alpha, isHead = false, pulse = 1) => {
        ctx.save();
        const finalSize = size * (isHead ? 1.05 : 0.9 + pulse * 0.1);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (isHead) {
            ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.font = `bold ${finalSize}px monospace`;
            ctx.fillText(char, x, y);
        } else {
            ctx.font = `bold ${finalSize}px monospace`;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.fillText(char, x, y);
        }
        ctx.restore();
    };

    const drawSnakeHD = (ctx, s, alpha = 1, progress = 1, glitch = 0, overridePos = null, time = 0) => {
        const scanlineX = progress * CANVAS_WIDTH;
        const drawSegment = (x, y, segmentAlpha, dist, isHead) => {
            let sx = x, sy = y;
            if (overridePos) {
                sx += (overridePos.x - (s.snake[0].x * GRID_SIZE + GRID_SIZE / 2));
                sy += (overridePos.y - (s.snake[0].y * GRID_SIZE + GRID_SIZE / 2));
            }
            if (sx > scanlineX && !isHead) return;
            const pulse = (Math.sin(dist * 0.8 - time * 12) + 1) / 2;
            const char = MATRIX_CHARS[Math.floor(sx + sy + dist * 5 + time * 10) % MATRIX_CHARS.length];
            drawBloomChar(ctx, char, sx, sy, GRID_SIZE * 1.1, segmentAlpha * alpha, isHead, pulse);
        };
        const head = s.snake[0];
        if (head) drawSegment(head.x * GRID_SIZE + GRID_SIZE / 2, head.y * GRID_SIZE + GRID_SIZE / 2, 1, 0, true);
        for (let i = 0; i < s.snake.length - 1; i++) {
            const curr = s.snake[i], next = s.snake[i + 1];
            const density = 3;
            for (let d = 0; d < density; d++) {
                const t = d / density, dist = i + t;
                const segmentAlpha = Math.max(0.1, 1 - (dist / (s.snake.length + 2)));
                drawSegment((curr.x + (next.x - curr.x) * t) * GRID_SIZE + GRID_SIZE / 2, (curr.y + (next.y - curr.y) * t) * GRID_SIZE + GRID_SIZE / 2, segmentAlpha, dist, false);
            }
        }
    };

    const drawPipesHD = (ctx, s, time) => {
        const pipeFont = Math.max(12, Math.min(24, GRID_SIZE * 0.5));
        const pipeCapSize = Math.max(24, Math.min(52, GRID_SIZE * 1.1));
        const pipeWidth = GRID_SIZE * 1.5;
        const hSpacing = GRID_SIZE * 0.25;

        s.pipes.forEach((pi, pipeIdx) => {
            if (pi.x > CANVAS_WIDTH + 100 || pi.x < -200) return;
            const drawPillar = (px, py, h, isTop) => {
                const strands = 5;
                const vSpacing = pipeFont * 1.3;
                ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                for (let i = 0; i < strands; i++) {
                    const cx = px + (pipeWidth / 2) + (i - 2) * hSpacing;
                    for (let sy = 5; sy < h; sy += vSpacing) {
                        const posSeed = Math.floor(pipeIdx * 1000 + i * 500 + Math.floor(sy / vSpacing));
                        const breathe = (Math.sin(time * 2 + posSeed * 0.5) + 1) / 2;
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + breathe * 0.6})`;
                        ctx.font = `bold ${pipeFont}px monospace`;
                        ctx.fillText(MATRIX_CHARS[posSeed % MATRIX_CHARS.length], cx, py + sy);
                    }
                }
                const capY = isTop ? py + h - (pipeFont * 0.5) : py + (pipeFont * 0.5);
                const globalPulse = (Math.sin(time * 3 + pipeIdx) + 1) / 2;
                for (let i = 0; i < strands; i++) {
                    const cx = px + (pipeWidth / 2) + (i - 2) * hSpacing;
                    drawBloomChar(ctx, MATRIX_CHARS[(pipeIdx + i + Math.floor(time * 2)) % MATRIX_CHARS.length], cx, capY, pipeCapSize, 1, true, globalPulse);
                }
                ctx.restore();
            };
            drawPillar(pi.x, 0, pi.gapY, true);
            drawPillar(pi.x, pi.gapY + pi.gapSize, CANVAS_HEIGHT - (pi.gapY + pi.gapSize), false);
        });
    };

    const drawFlappyHD = (ctx, s, alpha = 1, progress = 1, glitch = 0, overridePos = null, time = 0) => {
        let bx = (overridePos ? overridePos.x : 60), by = (overridePos ? overridePos.y : s.birdY);
        if (bx <= progress * CANVAS_WIDTH) {
            const activeSize = Math.max(20, Math.min(48, GRID_SIZE * 0.9));
            const pulse = (Math.sin(time * 15) + 1) / 2, flap = Math.sin(time * 25) * (activeSize * 0.3);
            ctx.save(); ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = '#0ff'; ctx.font = `bold ${activeSize}px monospace`; ctx.fillText('◊', bx - 5, by);
            ctx.globalAlpha = alpha; ctx.fillStyle = '#fff'; ctx.font = `bold ${activeSize}px monospace`;
            ctx.fillText('>', bx - (activeSize * 0.8), by - (activeSize * 0.2) + flap); ctx.fillText('>', bx - (activeSize * 0.8), by + (activeSize * 0.2) - flap);
            drawBloomChar(ctx, '◊', bx, by, activeSize * 1.8, alpha, true, pulse); ctx.restore();
        }
    };

    const drawParallax = (ctx, time, groundY, alpha) => {
        ctx.save();
        // Distant Circuit Traces
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const px = (time * -(20 + i * 10) + i * 200) % CANVAS_WIDTH;
            const py = groundY - 150 + (i * 30);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 100, py);
            ctx.lineTo(px + 120, py - 20);
            ctx.stroke();
        }
        ctx.restore();
    };

    const drawCyberCat = (ctx, x, y, isJumping, isDucking, time, alpha, isGhost = false, groundSpeed = 6) => {
        ctx.save();
        const finalAlpha = isGhost ? alpha * 0.3 : alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${finalAlpha})`;
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
        ctx.lineWidth = Math.max(1.2, GRID_SIZE / 15);
        ctx.lineCap = 'round';
        if (!isGhost) {
            ctx.shadowBlur = GRID_SIZE / 2;
            ctx.shadowColor = '#fff';
        }

        const scale = Math.max(0.8, GRID_SIZE / 25);
        const bodyWidth = 32 * scale;
        const bodyHeight = 8 * scale;
        const headRadiusX = 7 * scale;
        const headRadiusY = 6 * scale;

        const bodyY = isDucking ? y - (bodyHeight * 0.5) : (isJumping ? y - (bodyHeight * 1.5) : y - bodyHeight);
        const headX = x + (isDucking ? 15 * scale : 12 * scale);
        const headY = isDucking ? y - (headRadiusY * 1.5) : (isJumping ? y - (headRadiusY * 4.5) : y - (headRadiusY * 3.5));
        const tailX = x - (15 * scale);

        // --- EXPRESSIVE TAIL ---
        ctx.beginPath();
        const tailFlick = Math.sin(time * 15) * (6 * scale);
        ctx.moveTo(tailX, bodyY - (4 * scale));
        ctx.quadraticCurveTo(tailX - (15 * scale), bodyY - (12 * scale) + tailFlick, tailX - (10 * scale), bodyY - (18 * scale) + tailFlick);
        ctx.stroke();

        // --- TRAILING BITS ---
        ctx.save();
        ctx.font = `${Math.max(8, 10 * scale)}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha * 0.4})`;
        const bits = ["1", "0", "1"];
        bits.forEach((bit, i) => {
            const bx = x - (35 * scale) - (i * 18 * scale) - (Math.sin(time * 10 + i) * 8 * scale);
            const by = y - (15 * scale) + (Math.cos(time * 10 + i) * 6 * scale);
            ctx.fillText(bit, bx, by);
        });
        ctx.restore();

        // --- SLEEK BODY ---
        ctx.beginPath();
        if (isDucking) {
            ctx.roundRect(x - (18 * scale), y - (12 * scale), bodyWidth, bodyHeight, 4 * scale);
        } else {
            ctx.moveTo(x - (15 * scale), y - (9 * scale));
            ctx.quadraticCurveTo(x - (3 * scale), y - (21 * scale), x + (9 * scale), y - (12 * scale));
            ctx.lineTo(x + (9 * scale), y - (6 * scale));
            ctx.lineTo(x - (15 * scale), y - (6 * scale));
            ctx.closePath();
        }
        ctx.stroke();

        // --- REFINED HEAD ---
        ctx.beginPath();
        ctx.ellipse(headX, headY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- SHARP EARS ---
        ctx.beginPath();
        ctx.moveTo(headX - (6 * scale), headY - (3 * scale)); ctx.lineTo(headX - (7 * scale), headY - (14 * scale)); ctx.lineTo(headX - (2 * scale), headY - (6 * scale));
        ctx.moveTo(headX + (6 * scale), headY - (3 * scale)); ctx.lineTo(headX + (7 * scale), headY - (14 * scale)); ctx.lineTo(headX + (2 * scale), headY - (6 * scale));
        ctx.fill();

        // --- RUNNING LEGS ---
        const walk = Math.sin(time * 20) * (10 * scale);
        ctx.beginPath();
        if (!isJumping) {
            ctx.moveTo(x + (7 * scale), y - (6 * scale)); ctx.lineTo(x + (6 * scale) + walk, y + (2 * scale));
            ctx.moveTo(x - (12 * scale), y - (6 * scale)); ctx.lineTo(x - (13 * scale) - walk, y + (2 * scale));
        } else {
            ctx.moveTo(x + (7 * scale), y - (6 * scale)); ctx.lineTo(x + (12 * scale), y + (3 * scale));
            ctx.moveTo(x - (12 * scale), y - (6 * scale)); ctx.lineTo(x - (6 * scale), y + (3 * scale));
        }
        ctx.stroke();

        ctx.restore();
    };

    const drawCatHD = (ctx, s, alpha = 1, progress = 1, time = 0, overridePos = null) => {
        const cx = overridePos ? overridePos.x : 120, cy = overridePos ? overridePos.y : s.catY;
        const groundY = CANVAS_HEIGHT * 0.85;

        drawParallax(ctx, time, groundY, alpha);

        ctx.save(); ctx.textAlign = 'left'; ctx.font = `${Math.max(10, GRID_SIZE * 0.3)}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
        const strand = "-=- <U> -=- <N> -=- <I> -=- <T> -=- <X> -=-";
        const strandWidth = ctx.measureText(strand).width || 400;
        for (let i = -1; i < 2; i++) {
            const gx = (time * -400 + i * strandWidth) % (strandWidth * 2);
            if (gx > -strandWidth && gx < CANVAS_WIDTH) ctx.fillText(strand, gx, groundY + (GRID_SIZE * 0.4));
        }
        ctx.fillRect(0, groundY + 2, CANVAS_WIDTH, 1);
        ctx.restore();

        if (progress > 0.4) s.obstacles.forEach((ob, idx) => {
            const ox = ob.x + (GRID_SIZE * 1.0); // Aligned with Engine center
            ctx.save(); ctx.textAlign = 'center'; ctx.font = `bold ${Math.max(11, GRID_SIZE * 0.4)}px monospace`;
            const stableIdx = ob.obsIdx || idx;
            const pulse = (Math.sin(time * 10 + stableIdx) + 1) / 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (0.8 + pulse * 0.2)})`;
            if (ob.type === 'cactus') {
                ctx.fillText("/---\\", ox, groundY - (GRID_SIZE * 0.8)); ctx.fillText("| [ ] |", ox, groundY - (GRID_SIZE * 0.5)); ctx.fillText("|_____|", ox, groundY - (GRID_SIZE * 0.2));
            } else {
                const float = Math.sin(time * 8 + stableIdx) * 10;
                let birdBaseY = (ob.type === 'bird-low' ? groundY - (GRID_SIZE * 1.4) : groundY - (GRID_SIZE * 2.4));
                const droneY = birdBaseY + float;
                ctx.fillText("< ERROR >", ox, droneY - (GRID_SIZE * 0.3)); ctx.fillText("`---'`", ox, droneY);
            }
            ctx.restore();
        });

        drawCyberCat(ctx, cx, cy, cy < groundY - 10, s.isDucking, time, alpha, false, s.groundSpeed);

        // After-images for high speed
        if (s.groundSpeed > 8) {
            drawCyberCat(ctx, cx - 15, cy, cy < groundY - 10, s.isDucking, time - 0.05, alpha * 0.5, true);
            drawCyberCat(ctx, cx - 30, cy, cy < groundY - 10, s.isDucking, time - 0.1, alpha * 0.2, true);
        }
    };

    const updateParticles = (ctx) => {
        if (particlesRef.current.length > 200) particlesRef.current.shift();
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.04;
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.4})`;
            ctx.fillRect(p.x, p.y, 2, 2); return p.life > 0;
        });
    };

    const spawnBurst = (x, y, count = 20) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0 + Math.random() * 0.5
            });
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        // console.log(`💎 [HeroSection] Canvas internal: ${canvas.width}x${canvas.height}, DOM: ${canvas.offsetWidth}x${canvas.offsetHeight}`);
        const ctx = canvas.getContext('2d', { alpha: false });
        const render = () => {
            const s = stateRef.current; if (!s) return;
            const time = Date.now() / 1000;
            ctx.save();
            // APPLY SMOOTH SCREEN SHAKE (Sine-based)
            if (s.screenShake > 0) {
                const sx = Math.sin(time * 100) * s.screenShake * 0.5;
                const sy = Math.cos(time * 80) * s.screenShake * 0.5;
                ctx.translate(sx, sy);
            }

            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 1;
            for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
            for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

            // SPAWN BURST ON COLLECTION
            if (s.lastFoodPos) {
                spawnBurst(s.lastFoodPos.x * GRID_SIZE + GRID_SIZE / 2, s.lastFoodPos.y * GRID_SIZE + GRID_SIZE / 2, 20);
                s.lastFoodPos = null;
            }

            updateParticles(ctx);
            if (s.impactPulse > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${s.impactPulse * 0.12})`;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            if (!s.isMorphing) {
                if (gameMode === 'snake') {
                    const fx = s.food.x * GRID_SIZE + GRID_SIZE / 2, fy = s.food.y * GRID_SIZE + GRID_SIZE / 2;
                    for (let i = 0; i < 2; i++) {
                        const rp = (time * 0.6 + i * 0.5) % 1;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - rp})`; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(fx, fy, rp * (GRID_SIZE * 2.2), 0, Math.PI * 2); ctx.stroke();
                    }
                    ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff'; ctx.font = `bold ${GRID_SIZE * 1.3}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(MATRIX_CHARS[Math.floor(time * 20) % MATRIX_CHARS.length], fx, fy); ctx.restore();
                    drawSnakeHD(ctx, s, 1, 1, 0, null, time);
                } else if (gameMode === 'flappy') { drawPipesHD(ctx, s, time); drawFlappyHD(ctx, s, 1, 1, 0, null, time); }
                else if (gameMode === 'cat') { drawCatHD(ctx, s, 1, 1, time); }
            } else {
                const p = 1 - (s.morphTimer / s.morphInitialDuration);
                const getModePos = (m) => {
                    if (m === 'snake') return { x: s.snake[0].x * GRID_SIZE, y: s.snake[0].y * GRID_SIZE };
                    if (m === 'flappy') return { x: 60, y: s.birdY };
                    if (m === 'cat') return { x: 120, y: s.catY };
                    return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
                };
                const focal = { x: (getModePos(s.previousMode).x + (getModePos(gameMode).x - getModePos(s.previousMode).x) * p), y: (getModePos(s.previousMode).y + (getModePos(gameMode).y - getModePos(s.previousMode).y) * p) };
                if (s.previousMode === 'snake') drawSnakeHD(ctx, s, 1 - p, 1 - p, 0, focal, time);
                if (s.previousMode === 'flappy') drawFlappyHD(ctx, s, 1 - p, 1 - p, 0, focal, time);
                if (s.previousMode === 'cat') drawCatHD(ctx, s, 1 - p, 1 - p, time, focal);
                if (gameMode === 'snake') drawSnakeHD(ctx, s, p, p, 0, focal, time);
                if (gameMode === 'flappy') drawFlappyHD(ctx, s, p, p, 0, focal, time);
                if (gameMode === 'cat') drawCatHD(ctx, s, p, p, time, focal);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(p * Math.PI) * 0.4})`;
                const sweepX = p * CANVAS_WIDTH;
                ctx.fillRect(sweepX - 2, 0, 4, CANVAS_HEIGHT);
                ctx.fillRect(sweepX - 40, 0, 1, CANVAS_HEIGHT);
            }
            ctx.restore(); renderLoopRef.current = requestAnimationFrame(render);
        };
        renderLoopRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(renderLoopRef.current);
    }, [gameMode, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE]);

    useEffect(() => {
        if (gameState === 'gameOver') {
            setCooldown(3);
            const timer = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setCooldown(0);
        }
    }, [gameState]);

    const handleRegister = () => {
        if (nameInput.trim().length >= 3) {
            registerUser(nameInput.trim());
            setIsEditingName(false);
        }
    };

    const handleChangeIdentity = () => {
        setNameInput(username || '');
        setIsEditingName(true);
    };

    const handleCancelIdentity = () => {
        setIsEditingName(false);
        setNameInput(username || '');
    };

    return (
        <div style={{ ...STYLES.container, touchAction: 'none' }}>
            <div style={STYLES.score}>{score}</div>
            {gameState === 'playing' && (
                <div style={STYLES.gameOverlay}>
                    <div style={{ ...STYLES.glassCard, padding: '15px 25px' }}>
                        <div style={STYLES.enigmaticIndicator}>
                            <div style={{ color: '#666', fontSize: '10px', fontWeight: '900', letterSpacing: '4px', marginBottom: '8px' }}>RETROMORPH_V3</div>
                            <div style={STYLES.mysticalLabel}>
                                PLAYING
                                <span style={{ opacity: Math.sin(Date.now() / 150) > 0 ? 1 : 0, transition: 'none' }}>:</span>
                                &nbsp;
                                {gameMode?.toUpperCase() || 'CORE'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MINIMALIST LEADERBOARD (BOTTOM RIGHT) */}
            {gameState === 'gameOver' && (
                <div style={STYLES.minimalLeaderboard}>
                    <div style={STYLES.leaderboardHeader}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>GLOBAL_STANDINGS [V3]</span>
                            {isLoadingLeaderboard && <span style={{ color: '#111', fontSize: '8px' }}>[SYNCING]</span>}
                        </div>
                    </div>
                    {leaderboard.slice(0, 8).map((entry, idx) => {
                        const isLatest = entry.isMine && entry.score === latestScoreValue;
                        return (
                            <div key={idx} style={{
                                ...STYLES.leaderboardRow,
                                color: entry.isMine ? '#fff' : '#888',
                                background: entry.isMine ? (isLatest ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)') : 'transparent',
                                padding: '6px 10px',
                                margin: '2px -10px',
                                borderRadius: '3px',
                                fontWeight: entry.isMine ? '900' : '500',
                                textShadow: entry.isMine ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                                position: 'relative'
                            }}>
                                <span style={{ width: '25px', opacity: 0.7, fontSize: '10px' }}>{idx + 1}</span>
                                <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                                    {entry.isMine && <span style={{ color: '#fff', marginRight: '6px' }}>&raquo;</span>}
                                    {entry.name}
                                    {isLatest && (
                                        <span style={{
                                            fontSize: '8px', background: '#fff', color: '#000',
                                            padding: '1px 4px', borderRadius: '2px', marginLeft: '8px',
                                            fontWeight: '900', letterSpacing: '1px'
                                        }}>LATEST</span>
                                    )}
                                </span>
                                <span style={{ fontWeight: '900', color: entry.isMine ? '#fff' : '#666' }}>{entry.score}</span>
                            </div>
                        );
                    })}
                    {/* Solo Rank Logic (if below Top 8) */}
                    {(() => {
                        const myEntry = leaderboard.find(e => e.isMine);
                        const myRank = myEntry ? (myEntry.rank || leaderboard.indexOf(myEntry) + 1) : null;

                        // Always show latest if it's NOT the high score
                        const isPersonalBest = myEntry && (latestScoreValue === myEntry.score);
                        const showLastAttempt = latestScoreValue !== null && !isPersonalBest;

                        return (
                            <>
                                {myRank > 8 && (
                                    <>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                        <div style={{
                                            ...STYLES.leaderboardRow,
                                            color: '#fff',
                                            background: 'rgba(255,255,255,0.08)',
                                            padding: '4px 8px',
                                            margin: '1px -8px',
                                            borderRadius: '2px',
                                            fontWeight: '800',
                                            textShadow: '0 0 10px rgba(255,255,255,0.3)'
                                        }}>
                                            <span style={{ width: '25px', opacity: 0.5 }}>{myRank}</span>
                                            <span style={{ flex: 1 }}>
                                                <span style={{ color: '#fff', marginRight: '6px' }}>&raquo;</span>
                                                {myEntry.name}
                                            </span>
                                            <span style={{ fontWeight: '900' }}>{myEntry.score}</span>
                                        </div>
                                    </>
                                )}

                                {showLastAttempt && (
                                    <>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                        <div style={{
                                            ...STYLES.leaderboardRow,
                                            color: '#aaa',
                                            fontSize: '9px',
                                            padding: '4px 8px',
                                            margin: '1px -8px',
                                            fontWeight: '900',
                                            letterSpacing: '2px'
                                        }}>
                                            <span style={{ flex: 1 }}>LAST_YIELD</span>
                                            <span style={{ color: '#fff' }}>{latestScoreValue}</span>
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* HERO / START SCREEN CONTENT */}
            {gameState === 'menu' && (
                <>
                    {/* Layer 1: Masked Branding (Full screen for perfect mapping) */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        pointerEvents: 'none',
                        // Adaptive CSS Masking
                        WebkitMaskImage: `radial-gradient(circle clamp(40px, 10%, 100px) at ${(playerPos.x / (CANVAS_WIDTH || 1)) * 100}% ${(playerPos.y / (CANVAS_HEIGHT || 1)) * 100}%, transparent 0%, transparent clamp(25px, 6%, 60px), black clamp(45px, 12%, 100px))`,
                        maskImage: `radial-gradient(circle clamp(40px, 10%, 100px) at ${(playerPos.x / (CANVAS_WIDTH || 1)) * 100}% ${(playerPos.y / (CANVAS_HEIGHT || 1)) * 100}%, transparent 0%, transparent clamp(25px, 6%, 60px), black clamp(45px, 12%, 100px))`
                    }}>
                        <div style={{ width: '100%', maxWidth: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
                            <h1 style={STYLES.heroTitle}>BETO.GAMES</h1>
                        </div>
                    </div>

                    {/* Layer 2: Interactive / Unmasked */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div
                            onClick={startGame}
                            onMouseEnter={() => setIsHoveringStart(true)}
                            onMouseLeave={() => setIsHoveringStart(false)}
                            style={{
                                ...STYLES.bigSquareButton,
                                border: '1px solid rgba(255,255,255,0.4)',
                                color: isHoveringStart ? '#000' : '#fff',
                                background: isHoveringStart ? '#fff' : 'rgba(255,255,255,0.08)',
                                pointerEvents: 'auto',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                animation: isHoveringStart ? 'none' : 'float 4s ease-in-out infinite',
                                boxShadow: isHoveringStart ? '0 0 30px rgba(255,255,255,0.4)' : '0 0 10px rgba(255,255,255,0.05)',
                                zIndex: 200,
                                transform: 'translateY(18vh)'
                            }}
                        >
                            <div style={{
                                fontSize: 'clamp(12px, 3vw, 15px)',
                                fontWeight: '900',
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                lineHeight: '1.4',
                                whiteSpace: 'nowrap'
                            }}>
                                {isHoveringStart ? 'PLAY NOW' : 'BREACH THE VOID'}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        position: 'absolute',
                        zIndex: 250,
                        display: 'flex',
                        gap: '15px',
                        transform: 'translateY(28vh)',
                        pointerEvents: 'auto'
                    }}>
                        <div
                            onClick={() => setIsAboutOpen(true)}
                            style={{
                                ...STYLES.infoButton,
                                background: isHoveringAbout ? '#ffffff' : 'rgba(0,0,0,0.6)',
                                color: isHoveringAbout ? '#000000' : '#ffffff',
                                transform: isHoveringAbout ? 'scale(1.2) rotate(15deg)' : 'scale(1) rotate(0deg)',
                                boxShadow: isHoveringAbout ? '0 0 30px rgba(255,255,255,0.5)' : 'none',
                                borderColor: isHoveringAbout ? '#ffffff' : 'rgba(255,255,255,0.4)'
                            }}
                            onMouseEnter={() => setIsHoveringAbout(true)}
                            onMouseLeave={() => setIsHoveringAbout(false)}
                        >
                            ?
                        </div>
                    </div>

                    {/* ABOUT OVERLAY */}
                    {isAboutOpen && (
                        <div style={STYLES.overlay}>
                            <div style={{ position: 'absolute', top: '30px', right: '30px' }}>
                                <div onClick={() => setIsAboutOpen(false)} style={{ ...STYLES.infoButton, border: 'none', fontSize: '24px' }}>×</div>
                            </div>

                            <div style={STYLES.overlayContent}>
                                <h2 style={{ ...STYLES.heroTitle, fontSize: 'clamp(24px, 5vw, 48px)', marginBottom: '20px' }}>ABOUT_CORE</h2>
                                <p style={STYLES.aboutText}>
                                    A metamorphic retro journey through the digital void. <br />
                                    Evolve your agent through three distinct phases as you yield data.
                                </p>

                                <div style={STYLES.tutorialGrid}>
                                    <div style={STYLES.tutorialCard}>
                                        <div style={STYLES.tutorialIcon}>🐍</div>
                                        <div style={STYLES.tutorialLabel}>SNAKE_PHASE</div>
                                        <div style={STYLES.controlInfo}>{isTouch ? 'SWIPE TO DIRECT' : 'ARROW KEYS TO DIRECT'}</div>
                                    </div>
                                    <div style={STYLES.tutorialCard}>
                                        <div style={STYLES.tutorialIcon}>🦅</div>
                                        <div style={STYLES.tutorialLabel}>FLAPPY_PHASE</div>
                                        <div style={STYLES.controlInfo}>{isTouch ? 'TAP TO FLAP' : 'SPACE / UP TO FLAP'}</div>
                                    </div>
                                    <div style={STYLES.tutorialCard}>
                                        <div style={STYLES.tutorialIcon}>🐈</div>
                                        <div style={STYLES.tutorialLabel}>CAT_PHASE</div>
                                        <div style={STYLES.controlInfo}>{isTouch ? 'TOP=JUMP / BOT=DUCK' : 'UP=JUMP / DOWN=DUCK'}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'clamp(60px, 10vh, 100px)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setIsAboutOpen(false)}
                                        onMouseEnter={() => setIsHoveringAck(true)}
                                        onMouseLeave={() => setIsHoveringAck(false)}
                                        style={{
                                            ...STYLES.acknowledgeButton,
                                            backgroundColor: isHoveringAck ? '#ffffff' : 'rgba(255,255,255,0.08)',
                                            color: isHoveringAck ? '#000000' : '#ffffff',
                                            transform: isHoveringAck ? 'translateY(-4px)' : 'translateY(0)',
                                            boxShadow: isHoveringAck ? '0 15px 40px rgba(255,255,255,0.25)' : 'none',
                                            border: isHoveringAck ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.4)'
                                        }}
                                    >
                                        ACKNOWLEDGED
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {gameState === 'playing' && showInGameTutorial && (
                <div style={{
                    ...STYLES.inGameTutorial,
                    ...(tutorialStatus === 'entering' ? STYLES.tutorialEntering : {}),
                    ...(tutorialStatus === 'exiting' ? STYLES.tutorialExiting : {})
                }}>
                    <div style={{ color: '#666', fontSize: '9px', fontWeight: '900', letterSpacing: '2px', marginBottom: '2px' }}>CONTROL_PROTOCOL</div>
                    <div style={STYLES.tutorialLabel}>
                        {showInGameTutorial === 'snake' && 'PHASE_01: SNAKE'}
                        {showInGameTutorial === 'flappy' && 'PHASE_02: FLAPPY'}
                        {showInGameTutorial === 'cat' && 'PHASE_03: CYBER_CAT'}
                    </div>

                    <div style={STYLES.controlVisualContainer}>
                        {/* THE VISUAL SIMULATORS */}

                        {/* DESKTOP VISUALS */}
                        {!isTouch && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                                <div style={STYLES.arrowKeyLayout}>
                                    <div />
                                    <div style={{
                                        ...STYLES.keyCap,
                                        ...((showInGameTutorial === 'snake') ||
                                            (showInGameTutorial === 'flappy') ||
                                            (showInGameTutorial === 'cat') ? STYLES.keyCapActive : {})
                                    }}>▲</div>
                                    <div />

                                    <div style={{
                                        ...STYLES.keyCap,
                                        ...((showInGameTutorial === 'snake') ? STYLES.keyCapActive : {})
                                    }}>◀</div>
                                    <div style={{
                                        ...STYLES.keyCap,
                                        ...((showInGameTutorial === 'cat') ? STYLES.keyCapActive : {})
                                    }}>▼</div>
                                    <div style={{
                                        ...STYLES.keyCap,
                                        ...((showInGameTutorial === 'snake') ? STYLES.keyCapActive : {})
                                    }}>▶</div>
                                </div>
                                {(showInGameTutorial === 'flappy' || showInGameTutorial === 'cat') && (
                                    <div style={{
                                        ...STYLES.spaceBar,
                                        ...STYLES.spaceBarActive
                                    }}>SPACE</div>
                                )}
                            </div>
                        )}

                        {/* MOBILE VISUALS */}
                        {isTouch && (
                            <div style={{ position: 'relative', width: '80px', height: '60px' }}>
                                {showInGameTutorial === 'snake' ? (
                                    <div style={STYLES.swipeVisual}>
                                        <div style={{
                                            ...STYLES.swipeFinger,
                                            left: `${50 + Math.cos(Date.now() / 300) * 30}%`,
                                            top: `${50 + Math.sin(Date.now() / 300) * 20}%`,
                                            ...STYLES.swipeFingerActive
                                        }} />
                                    </div>
                                ) : (
                                    <div style={STYLES.swipeVisual}>
                                        {/* TOP TAP (JUMP) */}
                                        <div style={{
                                            ...STYLES.swipeFinger,
                                            left: '50%',
                                            top: '25%',
                                            transform: 'translate(-50%, -50%)',
                                            display: Math.sin(Date.now() / 300) > 0 ? 'block' : 'none',
                                            ...STYLES.swipeFingerActive
                                        }} />
                                        {/* BOTTOM HOLD (DUCK) - Only for Cat */}
                                        {showInGameTutorial === 'cat' && (
                                            <div style={{
                                                ...STYLES.swipeFinger,
                                                left: '50%',
                                                top: '75%',
                                                transform: 'translate(-50%, -50%)',
                                                display: Math.sin(Date.now() / 300) < 0 ? 'block' : 'none',
                                                ...STYLES.fingerHolding
                                            }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={STYLES.controlInfo}>
                            {showInGameTutorial === 'snake' && (isTouch ? '[SWIPE]_TO_SLITHER' : '[ARROWS]_TO_SLITHER')}
                            {showInGameTutorial === 'flappy' && (isTouch ? '[TAP]_TO_FLAP' : '[SPACE/UP]_TO_FLAP')}
                            {showInGameTutorial === 'cat' && (isTouch ? '[TOP/BOT]_JUMP_DUCK' : '[UP/DOWN]_JUMP_DUCK')}
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'gameOver' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', overflowY: 'auto', overflowX: 'hidden',
                    paddingTop: 'min(20vh, 180px)', paddingBottom: '10vh',
                    pointerEvents: 'none', scrollBehavior: 'smooth'
                }}>
                    <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        {(!username || isEditingName) ? (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={STYLES.modIdPrompt}>IDENTIFY_YOURSELF</div>
                                <input
                                    autoFocus
                                    type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value.toUpperCase().slice(0, 10))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); if (e.key === 'Escape') handleCancelIdentity(); }}
                                    style={STYLES.cyberInput}
                                    placeholder="..."
                                />
                                <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                    <button onClick={handleRegister} style={{ ...STYLES.minimalButton, width: '140px', borderColor: '#fff', color: '#fff' }}> COMMIT_ID </button>
                                    {isEditingName && (
                                        <button onClick={handleCancelIdentity} style={{ ...STYLES.minimalButton, width: '100px', border: 'none' }}> CANCEL </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={STYLES.navButtonGroup}>
                                    <div
                                        style={{ ...STYLES.bigSquareButton, opacity: isHoveringOther ? 1 : 0.6 }}
                                        onMouseEnter={() => setIsHoveringOther(true)}
                                        onMouseLeave={() => setIsHoveringOther(false)}
                                        onClick={() => setCurrentPage && setCurrentPage('GAMES')}
                                    >
                                        <dc.Icon icon="zap" style={{ width: 'min(7vw, 30px)', height: 'min(7vw, 30px)', color: '#fff', opacity: 0.8 }} />
                                        <div style={{ fontSize: 'min(1.8vw, 10px)', fontWeight: '900', letterSpacing: '0.2vw' }}>GAMES</div>
                                    </div>

                                    <div
                                        style={{
                                            ...STYLES.bigSquareButton,
                                            border: isHoveringLeaderboard ? '1px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: isHoveringLeaderboard ? '0 0 20px rgba(255,255,255,0.1)' : 'none',
                                            background: isHoveringLeaderboard ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)',
                                            opacity: isHoveringLeaderboard ? 1 : 0.8
                                        }}
                                        onMouseEnter={() => setIsHoveringLeaderboard(true)}
                                        onMouseLeave={() => setIsHoveringLeaderboard(false)}
                                        onClick={() => startGame(true)}
                                    >
                                        <dc.Icon icon="rotate-ccw" style={{ width: 'min(9vw, 42px)', height: 'min(9vw, 42px)', color: '#fff' }} />
                                        <div style={{ fontSize: 'min(2.2vw, 12px)', fontWeight: '900', letterSpacing: '0.2vw' }}>AGAIN</div>
                                    </div>

                                    <div
                                        style={{ ...STYLES.bigSquareButton, opacity: isHoveringAbout ? 1 : 0.6 }}
                                        onMouseEnter={() => setIsHoveringAbout(true)}
                                        onMouseLeave={() => setIsHoveringAbout(false)}
                                        onClick={() => setCurrentPage && setCurrentPage('ABOUT')}
                                    >
                                        <dc.Icon icon="help-circle" style={{ width: 'min(8vw, 36px)', height: 'min(8vw, 36px)', color: '#fff', opacity: 0.8 }} />
                                        <div style={{ fontSize: 'min(1.8vw, 10px)', fontWeight: '900', letterSpacing: '0.2vw' }}>ABOUT</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 'clamp(20px, 5vh, 40px)' }}>
                                    <div style={{
                                        ...STYLES.heroTitle,
                                        fontSize: 'clamp(32px, 10vw, 72px)',
                                        letterSpacing: '0.1em'
                                    }}>BETO.GAMES</div>
                                    {score > 0 && <div style={{
                                        fontSize: 'clamp(14px, 5vw, 18px)',
                                        color: '#fff',
                                        marginTop: '15px',
                                        letterSpacing: 'clamp(4px, 2vw, 8px)',
                                        fontWeight: '900',
                                        opacity: 0.9
                                    }}>DATA_YIELD: {score}</div>}
                                </div>

                                <button
                                    onClick={handleChangeIdentity}
                                    style={{
                                        ...STYLES.minimalButton,
                                        fontSize: '11px',
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        padding: '12px 30px',
                                        marginTop: '20px'
                                    }}
                                >
                                    CHANGE_USERNAME // {username}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={STYLES.canvas} />
        </div>
    );
}

export {  HeroSection  };
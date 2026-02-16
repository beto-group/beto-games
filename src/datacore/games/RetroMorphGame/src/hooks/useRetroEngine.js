function useRetroEngine(dc) {
    const { useState, useEffect, useRef } = dc;

    // Game Constants
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const CANVAS_WIDTH = canvasSize.width;
    const CANVAS_HEIGHT = canvasSize.height;
    const [GRID_SIZE, setGridSize] = useState(20);

    const [gridDims, setGridDims] = useState({ cols: 40, rows: 30 });
    const { cols, rows } = gridDims;

    const dimsRef = useRef({ cols: 40, rows: 30, GRID_SIZE: 20, CANVAS_WIDTH: 800, CANVAS_HEIGHT: 600 });

    const getSafeFoodPos = (currentCols, currentRows, currentGridSize) => {
        let x, y, isSafe = false;
        let attempts = 0;
        while (!isSafe && attempts < 50) {
            x = 2 + Math.floor(Math.random() * (currentCols - 4));
            y = 2 + Math.floor(Math.random() * (currentRows - 4));

            // Avoid top-left UI zone (approx 160x100 pixels)
            const px = x * currentGridSize;
            const py = y * currentGridSize;
            if (!(px < 160 && py < 100)) {
                isSafe = true;
            }
            attempts++;
        }
        return { x, y };
    };

    useEffect(() => {
        const updateDims = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            let newGridSize = 25;
            if (w < 600) newGridSize = 26; // Compact Mobile (was 50)
            else if (w < 1024) newGridSize = 35; // Bold Tablet
            else {
                // Mega-Canvas Scaling
                newGridSize = Math.max(35, Math.min(80, Math.floor(w / 28)));
            }

            // Round to nearest GRID_SIZE
            const newCols = Math.floor(w / newGridSize);
            const newRows = Math.floor(h / newGridSize);

            setGridSize(newGridSize);
            setCanvasSize({ width: newCols * newGridSize, height: newRows * newGridSize });
            setGridDims({ cols: newCols, rows: newRows });

            dimsRef.current = {
                cols: newCols,
                rows: newRows,
                GRID_SIZE: newGridSize,
                CANVAS_WIDTH: newCols * newGridSize,
                CANVAS_HEIGHT: newRows * newGridSize
            };
        };

        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    // Modes
    const MODES = {
        SNAKE: 'snake',
        FLAPPY: 'flappy',
        CAT: 'cat'
    };

    const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
    const [gameMode, setGameMode] = useState(MODES.SNAKE);
    const gameModeRef = useRef(MODES.SNAKE); // REF for loop logic

    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const [highScore, setHighScore] = useState(0);

    const [username, setUsername] = useState(() => {
        const saved = localStorage.getItem('retromorph_username');
        return (saved && saved !== 'null' && saved !== 'undefined' && saved.trim().length >= 3) ? saved.trim() : '';
    });
    const [userGuid, setUserGuid] = useState(() => {
        const saved = localStorage.getItem('retromorph_guid_v3');
        return (saved && saved !== 'null' && saved !== 'undefined') ? saved : '';
    });
    const [leaderboard, setLeaderboard] = useState(() => {
        const saved = localStorage.getItem('retromorph_leaderboard');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });

    const usernameRef = useRef(username);
    const gameOverTimeRef = useRef(0);
    const userGuidRef = useRef(userGuid);
    const leaderboardRef = useRef(leaderboard);

    const [isServerOffline, setIsServerOffline] = useState(false);
    const [pendingScores, setPendingScores] = useState(() => {
        const saved = localStorage.getItem('retromorph_pending_scores');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });

    const pendingScoresRef = useRef(pendingScores);

    useEffect(() => { usernameRef.current = username; }, [username]);
    useEffect(() => { userGuidRef.current = userGuid; }, [userGuid]);
    useEffect(() => { leaderboardRef.current = leaderboard; }, [leaderboard]);
    useEffect(() => { pendingScoresRef.current = pendingScores; }, [pendingScores]);

    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    const [latestScoreValue, setLatestScoreValue] = useState(null);
    const [totalGames, setTotalGames] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [isPlayerInUIZone, setIsPlayerInUIZone] = useState(false);
    const [playerPos, setPlayerPos] = useState({ x: 400, y: 300 });

    const ITCH_PUBLIC_KEY = "fb5d49101a6e48343f94ad3772dd2825985d1414f5ccc406";
    const API_BASE = "https://lcv3-server.danqzq.games";

    const state = useRef({
        // Snake State
        snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
        direction: { x: 1, y: 0 },
        inputQueue: [],
        food: { x: 8, y: 8 },
        lastSnakeMove: 0,
        pendingSegments: 0,
        snakeVisitCount: 0,

        // Flappy State
        birdY: 300,
        birdVelocity: 0,
        pipes: [],

        // Cat State
        catY: 400,
        catVelocity: 0,
        isJumping: false,
        isDucking: false,
        obstacles: [],
        groundSpeed: 5,

        // Common
        lastFrameTime: 0,
        frameCount: 0,
        isMorphing: false,
        previousMode: null,
        morphTimer: 0,
        morphInitialDuration: 1500,
        screenShake: 0,
        impactPulse: 0,
        lastFoodPos: null,
        isAutoPlaying: true,
        isPlayerInUIZone: false,
        playerPos: { x: 400, y: 300 }
    });

    // Auto-sync background on resize
    useEffect(() => {
        if (gameState === 'menu') {
            resetAI();
        }
    }, [cols, rows, gameState]);

    const loopRef = useRef(null);
    const gameStateRef = useRef(gameState);

    // Sync Ref with State
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Sync Game Mode Ref
    useEffect(() => {
        gameModeRef.current = gameMode;
    }, [gameMode]);

    // --- AI CONTROLLERS ---
    const updateAI = (s, mode) => {
        if (!s.isAutoPlaying) return;

        // Shared constants for AI
        const chew = dimsRef.current.CANVAS_HEIGHT;
        const cgrid = dimsRef.current.GRID_SIZE;
        const pipeWidth = cgrid * 1.5;
        const birdX = mode === MODES.FLAPPY ? 60 : 120; // Flappy center vs Cat center

        if (mode === MODES.SNAKE) {
            const head = s.snake[0];
            const food = s.food;
            const { cols, rows } = dimsRef.current;
            const bodySet = new Set(s.snake.map(seg => `${seg.x},${seg.y}`));

            const getNeighbors = (p) => {
                return [
                    { x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y },
                    { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }
                ].filter(n => n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows && !bodySet.has(`${n.x},${n.y}`));
            };

            // 1. BFS for Shortest Path to Food
            const queue = [[head]];
            const visited = new Set([`${head.x},${head.y}`]);
            let foundPath = null;

            while (queue.length > 0) {
                const path = queue.shift();
                const curr = path[path.length - 1];

                if (curr.x === food.x && curr.y === food.y) {
                    foundPath = path;
                    break;
                }

                for (const neighbor of getNeighbors(curr)) {
                    const key = `${neighbor.x},${neighbor.y}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push([...path, neighbor]);
                    }
                }
            }

            if (foundPath && foundPath.length > 1) {
                s.direction = { x: foundPath[1].x - head.x, y: foundPath[1].y - head.y };
            } else {
                // 2. Survival Fallback: Pick move with MOST reachable area (Breadth-first area count)
                const possibleMoves = getNeighbors(head);
                let bestMove = s.direction;
                let maxArea = -1;

                for (const move of possibleMoves) {
                    // Quick Flood Fill (limited depth for performance)
                    const fQueue = [move];
                    const fVisited = new Set([`${head.x},${head.y}`, `${move.x},${move.y}`]);
                    let area = 0;
                    while (fQueue.length > 0 && area < 100) {
                        const curr = fQueue.shift();
                        area++;
                        for (const n of getNeighbors(curr)) {
                            const key = `${n.x},${n.y}`;
                            if (!fVisited.has(key)) {
                                fVisited.add(key);
                                fQueue.push(n);
                            }
                        }
                    }
                    if (area > maxArea) {
                        maxArea = area;
                        bestMove = { x: move.x - head.x, y: move.y - head.y };
                    }
                }
                s.direction = bestMove;
            }
        } else if (mode === MODES.FLAPPY) {
            const birdY = s.birdY;
            const nextPipe = s.pipes.find(p => p.x + pipeWidth > birdX - 20) || s.pipes[0];

            // 1. DYNAMIC TARGETING
            const targetY = nextPipe ? nextPipe.gapY + (nextPipe.gapSize * 0.8) : (chew * 0.5);

            // 2. PREDICTIVE CRASH AVOIDANCE
            const currentFloorLimit = (nextPipe && nextPipe.x < birdX + 20) ? (nextPipe.gapY + nextPipe.gapSize) : chew;
            const predictedY = birdY + (s.birdVelocity * 10);
            const willCrashFloor = predictedY > currentFloorLimit - 25;

            // 3. SMART CEILING SAFETY
            const topLimit = (nextPipe && nextPipe.x < birdX + 40) ? nextPipe.gapY : -1000;
            const jumpRise = 170;
            const isCeilingSafe = (birdY - jumpRise > topLimit + 10);

            // 4. JUMP DECISION
            if (willCrashFloor || (birdY > targetY && s.birdVelocity > 0.5 && isCeilingSafe)) {
                s.birdVelocity = -15.2;
            }
        } else if (mode === MODES.CAT) {
            const groundY = chew * 0.85;

            // 1. SCAN WINDOW (400px ahead, 80px behind)
            const windowObstacles = s.obstacles.filter(o => o.x > birdX - (cgrid * 4) && o.x < birdX + 400);

            if (windowObstacles.length === 0) {
                s.isDucking = false;
                return;
            }

            const cactusNearby = windowObstacles.find(o => o.type === 'cactus');
            const birdNearby = windowObstacles.find(o => o.type.startsWith('bird'));

            // 2. JUMP LOGIC (Ground / Cactus)
            // Prioritize jumping if a cactus is within the trigger zone
            if (cactusNearby && !s.isJumping) {
                // Peak rise of jump happens at approx 14 frames. 
                // Using 13.5 as lead for maximum height over the cactus.
                const leadDist = s.groundSpeed * 13.5;
                if (cactusNearby.x < birdX + leadDist && cactusNearby.x > birdX - (cgrid * 1)) {
                    s.catVelocity = -(chew * 0.048);
                    s.isJumping = true;
                    s.isDucking = false;
                }
            }

            // 3. DUCK LOGIC (Aerial / Birds)
            // Duck if a bird is in range AND we aren't currently jumping
            if (!s.isJumping) {
                if (birdNearby) {
                    // Start ducking early and hold until it's well past the tail
                    if (birdNearby.x < birdX + 350 && birdNearby.x > birdX - (cgrid * 4)) {
                        s.isDucking = true;
                    } else {
                        s.isDucking = false;
                    }
                } else {
                    s.isDucking = false;
                }
            } else {
                // If jumping, we can't duck
                s.isDucking = false;
            }
        }
    };

    // Auto-start loop for background + Visibility Resync
    useEffect(() => {
        state.current.lastFrameTime = performance.now();
        loopRef.current = requestAnimationFrame(gameLoop);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = performance.now();
                state.current.lastFrameTime = now;
                state.current.lastSnakeMove = now;
                console.log("🎮 [RetroMorph] Tab visible - Resyncing timers");
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            if (loopRef.current) cancelAnimationFrame(loopRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Inputs
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (gameStateRef.current !== 'playing') {
                // RESTRICTED RESTART: Only allow 'Enter' or space on menu.
                // During GameOver, we want to force using the UI buttons to prevent accidental restarts.
                if (gameStateRef.current === 'menu') {
                    if (e.key === ' ' || e.key === 'Enter') startGame();
                }
                return;
            }
            const s = state.current;
            if (s.isMorphing) return; // INPUT LOCK

            const currentMode = gameModeRef.current;

            if (currentMode === MODES.SNAKE) {
                const getNewDir = (key) => {
                    if (key === 'ArrowUp') return { x: 0, y: -1 };
                    if (key === 'ArrowDown') return { x: 0, y: 1 };
                    if (key === 'ArrowLeft') return { x: -1, y: 0 };
                    if (key === 'ArrowRight') return { x: 1, y: 0 };
                    return null;
                };
                const newDir = getNewDir(e.key);
                if (newDir) {
                    const lastDir = s.inputQueue.length > 0 ? s.inputQueue[s.inputQueue.length - 1] : s.direction;
                    const isOpposite = (newDir.x !== 0 && newDir.x === -lastDir.x) || (newDir.y !== 0 && newDir.y === -lastDir.y);
                    // Prevent 180-degree turn in a single frame to avoid "stumbling" on own neck
                    if (!isOpposite && s.inputQueue.length < 2) {
                        s.inputQueue.push(newDir);
                    }
                }
            } else if (currentMode === MODES.FLAPPY) {
                if (e.key === ' ' || e.key === 'ArrowUp') {
                    s.birdVelocity = -15.2; // Balanced buoyant lift (was -15.3)
                }
            } else if (currentMode === MODES.CAT) {
                if ((e.key === ' ' || e.key === 'ArrowUp') && !s.isJumping) {
                    s.catVelocity = -(dimsRef.current.CANVAS_HEIGHT * 0.048); // Aggressively refined to 34% peak (was 0.042)
                    s.isJumping = true;
                    s.isDucking = false; // Cancel duck on jump
                }
                if (e.key === 'ArrowDown') {
                    if (!s.isJumping) s.isDucking = true;
                    // Removed fast-fall to keep physics simple/consistent
                }
            }
        };

        const handleKeyUp = (e) => {
            const s = state.current;
            const currentMode = gameModeRef.current;
            if (currentMode === MODES.CAT && e.key === 'ArrowDown') {
                s.isDucking = false;
            }
        };

        const touchStartPos = { x: 0, y: 0 };
        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            touchStartPos.x = touch.clientX;
            touchStartPos.y = touch.clientY;

            if (gameStateRef.current !== 'playing') {
                // RESTRICTED RESTART: No global touch-to-restart on GameOver/Menu.
                // Force user to hit the dedicated "PLAY" or "AGAIN" buttons.
                return;
            }

            const currentMode = gameModeRef.current;
            const s = state.current;
            if (s.isMorphing) return;

            if (currentMode === MODES.FLAPPY) {
                s.birdVelocity = -15.2; // Balanced buoyant lift (was -15.3)
            } else if (currentMode === MODES.CAT) {
                const rect = e.target.getBoundingClientRect();
                const relativeY = touch.clientY - rect.top;
                const height = rect.height;

                if (relativeY < height * 0.7) { // Top 70% jump
                    if (!s.isJumping) {
                        s.catVelocity = -(dimsRef.current.CANVAS_HEIGHT * 0.048); // Aggressively refined to 34% peak (was 0.042)
                        s.isJumping = true;
                        s.isDucking = false;
                    }
                } else { // Bottom 30% duck
                    if (!s.isJumping) s.isDucking = true;
                }
            }
        };

        const handleTouchEnd = (e) => {
            if (gameStateRef.current !== 'playing') return;
            const currentMode = gameModeRef.current;
            const s = state.current;

            if (currentMode === MODES.SNAKE) {
                const touch = e.changedTouches[0];
                const dx = touch.clientX - touchStartPos.x;
                const dy = touch.clientY - touchStartPos.y;
                const absX = Math.abs(dx);
                const absY = Math.abs(dy);

                if (Math.max(absX, absY) > 20) { // Min swipe threshold
                    let newDir = null;
                    if (absX > absY) {
                        newDir = { x: dx > 0 ? 1 : -1, y: 0 };
                    } else {
                        newDir = { x: 0, y: dy > 0 ? 1 : -1 };
                    }

                    if (newDir) {
                        const lastDir = s.inputQueue.length > 0 ? s.inputQueue[s.inputQueue.length - 1] : s.direction;
                        const isOpposite = (newDir.x !== 0 && newDir.x === -lastDir.x) || (newDir.y !== 0 && newDir.y === -lastDir.y);
                        if (!isOpposite && s.inputQueue.length < 2) {
                            s.inputQueue.push(newDir);
                        }
                    }
                }
            } else if (currentMode === MODES.CAT) {
                s.isDucking = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: false });
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [gameMode]);

    // Game Loop
    const startGame = (force = false) => {
        // PREVENT ACCIDENTAL RESTART (3s Grace Period)
        if (!force && gameStateRef.current === 'gameOver') {
            const timeSinceDeath = Date.now() - gameOverTimeRef.current;
            if (timeSinceDeath < 3000) {
                console.log(`⏳ Restart blocked: ${3 - Math.floor(timeSinceDeath / 1000)}s remaining (Use UI to override)`);
                return;
            }
        }

        const { cols: currentCols, rows: currentRows, GRID_SIZE: currentGridSize } = dimsRef.current;
        const s = state.current;
        s.isAutoPlaying = false;

        setGameState('playing');
        gameStateRef.current = 'playing';
        setScore(0);
        scoreRef.current = 0;

        setGameMode(MODES.SNAKE);
        gameModeRef.current = MODES.SNAKE;

        // Reset State
        const now = performance.now();
        state.current = {
            ...state.current,
            snake: [{ x: Math.floor(currentCols / 2), y: Math.floor(currentRows / 2) }, { x: Math.floor(currentCols / 2) - 1, y: Math.floor(currentRows / 2) }, { x: Math.floor(currentCols / 2) - 2, y: Math.floor(currentRows / 2) }],
            direction: { x: 1, y: 0 },
            inputQueue: [],
            food: getSafeFoodPos(currentCols, currentRows, currentGridSize),
            lastSnakeMove: now, // RESET to now to prevent immediate first-tick jump
            birdY: 300,
            birdVelocity: 0,
            pipes: [],
            catY: dimsRef.current.CANVAS_HEIGHT * 0.85,
            catVelocity: 0,
            isJumping: false,
            isDucking: false,
            obstacles: [],
            groundSpeed: 6,
            lastFrameTime: now,
            frameCount: 0,
            isMorphing: true, // CINEMATIC START
            previousMode: null, // Signals "sweep from background"
            morphTimer: 1500,
            morphInitialDuration: 1500,
            screenShake: 0,
            impactPulse: 0,
            lastFoodPos: null,
            pendingSegments: 0,
            snakeVisitCount: 1 // Start at 1
        };

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
        loopRef.current = requestAnimationFrame(gameLoop);
    };

    const resetAI = () => {
        const s = state.current;
        const { cols: ccols, rows: crows, GRID_SIZE: cgrid } = dimsRef.current;
        s.isAutoPlaying = true;
        s.snake = [{ x: Math.floor(ccols / 2), y: Math.floor(crows / 2) }, { x: Math.floor(ccols / 2) - 1, y: Math.floor(crows / 2) }, { x: Math.floor(ccols / 2) - 2, y: Math.floor(crows / 2) }];
        s.direction = { x: 1, y: 0 };
        s.inputQueue = [];
        s.food = getSafeFoodPos(ccols, crows, cgrid);
        s.birdY = 300;
        s.birdVelocity = 0;
        s.pipes = [];
        s.catY = 400;
        s.catVelocity = 0;
        s.isJumping = false;
        s.isDucking = false;
        s.obstacles = [];
        s.isMorphing = false;
        scoreRef.current = 0;
        setScore(0);
        setGameMode(MODES.SNAKE);
        gameModeRef.current = MODES.SNAKE;
    };

    const gameLoop = (timestamp) => {
        if (gameStateRef.current === 'gameOver') return;

        const s = state.current;
        const currentMode = gameModeRef.current;

        // AI Update
        if (s.isAutoPlaying) {
            updateAI(s, currentMode);
        }
        let delta = timestamp - s.lastFrameTime;

        // --- SPEED FIX: Capping delta to prevent "Catch-up" explosions ---
        if (delta > 200) {
            console.log(`[RetroMorph] Large delta detected (${Math.round(delta)}ms). Capping to 16ms.`);
            delta = 16;
            s.lastSnakeMove = timestamp; // Reset snake metronome
        }

        // Decay Impact FX
        if (s.screenShake > 0) s.screenShake = Math.max(0, s.screenShake - delta * 0.05);
        if (s.impactPulse > 0) s.impactPulse = Math.max(0, s.impactPulse - delta * 0.05);

        // FPS CAP: 60 FPS (~16.6ms)
        if (delta < 16) {
            loopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // Handles Morphing
        if (s.isMorphing) {
            s.morphTimer -= delta;
            s.lastFrameTime = timestamp;
            if (s.morphTimer <= 0) {
                s.isMorphing = false;
                s.lastSnakeMove = timestamp; // RESET timer to current moment to prevent "catch-up" jump
            }
            loopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        s.lastFrameTime = timestamp;

        // Logic Tick
        if (currentMode === MODES.SNAKE) {
            if (!s.lastSnakeMove) s.lastSnakeMove = timestamp;
            const initialTick = 140; // Fine-tuned to 140ms for a balanced start
            const loopCount = Math.floor(scoreRef.current / 450); // Normalized for tripled 450pt cycle
            const loopScaling = 1 + (loopCount * 0.05); // Gentle 5% boost per full cycle (was 10% per visit)
            const tick = Math.max(70, (initialTick / loopScaling) - (scoreRef.current * 0.05)); // Softened score weight (was 0.15)

            // METRONOME ACCUMULATION: Use a while loop to step exact beats
            // This prevents "stutter" by ensuring moves happen at a fixed cadence 
            // regardless of when the frame actually renders.
            let safety = 0;
            while (timestamp - s.lastSnakeMove > tick && safety < 2) {
                updateSnake(s);
                s.lastSnakeMove += tick; // INCREMENT by exact tick to keep rhythm
                safety++;
            }
        } else {
            updateAction(s, currentMode);
        }

        checkModeTransition();

        // --- OCCLUSION DETECTION ---
        const UI_ZONE = { xMin: 200, xMax: 600, yMin: 150, yMax: 450 };
        const { GRID_SIZE: cgrid } = dimsRef.current;
        let px = 0, py = 0;
        if (currentMode === MODES.SNAKE) {
            px = s.snake[0].x * cgrid;
            py = s.snake[0].y * cgrid;
        } else if (currentMode === MODES.FLAPPY) {
            px = 60;
            py = s.birdY;
        } else if (currentMode === MODES.CAT) {
            px = 120;
            py = s.catY;
        }

        const inZone = (px > UI_ZONE.xMin && px < UI_ZONE.xMax && py > UI_ZONE.yMin && py < UI_ZONE.yMax);
        if (inZone !== s.isPlayerInUIZone) {
            s.isPlayerInUIZone = inZone;
            setIsPlayerInUIZone(inZone);
        }

        // Always update pos for smooth masking
        setPlayerPos({ x: px, y: py });

        loopRef.current = requestAnimationFrame(gameLoop);
    };

    // --- LOGIC UPDATES ---

    const updateSnake = (s) => {
        const { cols: ccols, rows: crows, GRID_SIZE: cgrid } = dimsRef.current;
        if (s.inputQueue.length > 0) {
            s.direction = s.inputQueue.shift();
        }
        const head = { x: s.snake[0].x + s.direction.x, y: s.snake[0].y + s.direction.y };

        if (head.x < 0 || head.x >= ccols || head.y < 0 || head.y >= crows) {
            gameOver();
            return;
        }
        if (s.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        s.snake.unshift(head);

        if (head.x === s.food.x && head.y === s.food.y) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            s.food = getSafeFoodPos(ccols, crows, cgrid);
            s.pendingSegments += 1; // Standard growth (was 3)
            s.impactPulse = 1.0;
        } else if (s.pendingSegments > 0) {
            s.pendingSegments--;
            // DON'T pop tail, let it grow
        } else {
            s.snake.pop(); // Remove tail
        }
    };

    const updateAction = (s, mode) => {
        if (mode === MODES.FLAPPY) {
            s.birdVelocity += 0.7; // Balanced buoyant gravity (was 0.8)
            s.birdY += s.birdVelocity;

            if (s.frameCount % 220 === 0) {
                const cgrid = dimsRef.current.GRID_SIZE;
                const chew = dimsRef.current.CANVAS_HEIGHT;
                const gapSize = cgrid * 6.0; // Expanded GAP (was 4.8)
                s.pipes.push({
                    x: dimsRef.current.CANVAS_WIDTH,
                    gapY: Math.random() * (chew - gapSize - 100) + 50,
                    gapSize: gapSize,
                    passed: false
                });
            }
            s.pipes.forEach(p => p.x -= 3);
            s.pipes = s.pipes.filter(p => p.x > -200);
            s.frameCount++;

            if (s.birdY > dimsRef.current.CANVAS_HEIGHT || s.birdY < 0) gameOver();
            s.pipes.forEach(p => {
                const cgrid = dimsRef.current.GRID_SIZE;
                const birdX = 60;
                const birdWidth = cgrid * 0.8;
                const birdHeight = cgrid * 0.8;
                const pipeWidth = cgrid * 1.5;

                if (p.x < birdX + birdWidth / 2 && p.x + pipeWidth > birdX - birdWidth / 2) {
                    if (s.birdY - birdHeight / 2 < p.gapY || s.birdY + birdHeight / 2 > p.gapY + p.gapSize) {
                        gameOver();
                    }
                }
                if (!p.passed && p.x + pipeWidth < birdX) {
                    p.passed = true;
                    scoreRef.current += 10; // Balanced for 150pt threshold
                    setScore(scoreRef.current);
                }
            });

        } else if (mode === MODES.CAT) {
            const chew = dimsRef.current.CANVAS_HEIGHT;
            const cgrid = dimsRef.current.GRID_SIZE;
            const groundY = chew * 0.85;

            s.catVelocity += (chew * 0.0034); // Balanced gravity for 26% arc (was 0.0038)
            s.catY += s.catVelocity;
            if (s.catY > groundY) {
                s.catY = groundY;
                s.catVelocity = 0;
                s.isJumping = false;
            }

            // Obstacles
            const spawnInterval = Math.max(80, 160 - (scoreRef.current / 5));
            if (s.frameCount % spawnInterval === 0) {
                const rand = Math.random();
                let type = 'cactus';
                if (rand > 0.6) type = 'bird-low';
                else if (rand > 0.45) type = 'bird-high';
                s.obstacles.push({
                    x: dimsRef.current.CANVAS_WIDTH,
                    type,
                    passed: false,
                    obsIdx: s.frameCount // Use frameCount as a unique stable index for animation sync
                });
            }
            s.obstacles.forEach(o => o.x -= s.groundSpeed);
            s.obstacles = s.obstacles.filter(o => o.x > -200);
            s.frameCount++;

            // Collision
            s.obstacles.forEach(o => {
                const birdX = 120; // Visual center
                const catWidth = cgrid * 1.5;
                const catHeight = s.isDucking ? cgrid * 0.45 : cgrid * 1.2;
                const catLeft = birdX - catWidth / 2;
                const catRight = birdX + catWidth / 2;
                let catTop = s.catY - catHeight;
                let catBottom = s.catY;

                let obsLeft, obsRight, obsTop, obsBottom, obsWidth;
                const obsCenter = o.x + (cgrid * 1.0); // Standardized center
                const currentTime = Date.now() / 1000;

                if (o.type === 'cactus') {
                    obsWidth = cgrid * 1.2; // NARROWER for cacti
                    obsLeft = obsCenter - obsWidth / 2;
                    obsRight = obsCenter + obsWidth / 2;
                    obsTop = groundY - (cgrid * 1.0);
                    obsBottom = groundY;
                } else if (o.type === 'bird-low') {
                    obsWidth = cgrid * 2.4; // WIDER for drones
                    obsLeft = obsCenter - obsWidth / 2;
                    obsRight = obsCenter + obsWidth / 2;
                    const float = Math.sin(currentTime * 8 + (o.obsIdx || 0)) * 10;
                    obsTop = groundY - (cgrid * 1.8) + float;
                    obsBottom = groundY - (cgrid * 1.0) + float;
                } else if (o.type === 'bird-high') {
                    obsWidth = cgrid * 2.4; // WIDER for drones
                    obsLeft = obsCenter - obsWidth / 2;
                    obsRight = obsCenter + obsWidth / 2;
                    const float = Math.sin(currentTime * 8 + (o.obsIdx || 0)) * 10;
                    obsTop = groundY - (cgrid * 2.8) + float;
                    obsBottom = groundY - (cgrid * 2.0) + float;
                }

                // Add "Leg Room" Mercy Buffer: Shrink cat bottom slightly when jumping
                if (s.isJumping) {
                    catBottom -= (cgrid * 0.15);
                }

                if (catRight > obsLeft && catLeft < obsRight) {
                    if (catBottom > obsTop && catTop < obsBottom) {
                        gameOver();
                    }
                }

                if (!o.passed && o.x + obsWidth < catLeft) {
                    o.passed = true;
                    scoreRef.current += 10; // Balanced for 150pt threshold
                    setScore(scoreRef.current);
                }
            });
        }
    };

    const checkModeTransition = () => {
        const sc = scoreRef.current;
        const cyclePos = sc % 450; // Tripled loop (150 * 3)

        let targetMode = MODES.SNAKE;
        if (cyclePos >= 150 && cyclePos < 300) targetMode = MODES.FLAPPY;
        else if (cyclePos >= 300) targetMode = MODES.CAT;

        if (targetMode !== gameModeRef.current) {
            const oldMode = gameModeRef.current;
            setGameMode(targetMode);
            gameModeRef.current = targetMode;

            state.current.isMorphing = true;
            state.current.previousMode = oldMode;
            state.current.morphTimer = 1500;
            state.current.morphInitialDuration = 1500;

            if (targetMode === MODES.SNAKE) {
                const { cols: ccols, rows: crows } = dimsRef.current;
                const loopCount = Math.floor(sc / 450); // Normalized for tripled cycle

                // --- BLACK BOX PERSISTENCE LOG ---
                const head = state.current.snake[0] || { x: 'N/A', y: 'N/A' };
                console.log(`[BlackBox] Entering SNAKE mode. sc: ${sc}, Loop: ${loopCount}, Len: ${state.current.snake.length}, Head: [${head.x}, ${head.y}]`);

                if (state.current.snake.length === 0) {
                    console.log("[BlackBox] Initializing NEW Snake...");
                    const startLength = 3 + (loopCount * 5);
                    const startSnake = [];
                    for (let i = 0; i < startLength; i++) {
                        startSnake.push({ x: Math.floor(ccols / 4) - i, y: Math.floor(crows / 4) });
                    }
                    state.current.snake = startSnake;
                    state.current.direction = { x: 1, y: 0 };
                    state.current.inputQueue = [];
                } else {
                    console.log("[BlackBox] Preserved Snake History Verified.");
                }

                state.current.groundSpeed = 6 + loopCount;
                state.current.snakeVisitCount++;
                state.current.pendingSegments = 0;
                state.current.lastSnakeMove = performance.now(); // Sync timer for clean re-entry
            } else if (targetMode === MODES.FLAPPY) {
                const loopCount = Math.floor(sc / 450);
                state.current.birdY = 300;
                state.current.birdVelocity = 0;
                state.current.pipes = [];
                state.current.frameCount = 0; // RESET for consistent first-pipe timing
                state.current.groundSpeed = 10 + loopCount;
            } else if (targetMode === MODES.CAT) {
                console.log(`[BlackBox] Exiting SNAKE mode. Saving state. Len: ${state.current.snake.length}`);
                state.current.catY = dimsRef.current.CANVAS_HEIGHT * 0.85;
                state.current.catVelocity = 0;
                state.current.isJumping = false;
                state.current.frameCount = 0; // RESET for consistent first-obstacle timing
                state.current.obstacles = [];
            }
        }
    };

    // --- Global Leaderboard Logic ---
    const fetchGlobalLeaderboard = async () => {
        if (!ITCH_PUBLIC_KEY || !userGuid) return;
        setIsLoadingLeaderboard(true);
        try {
            // SECURITY: No destructive endpoints (Delete/Update) are used. 
            const res = await fetch(`${API_BASE}/get?key=${ITCH_PUBLIC_KEY}`);
            if (res.ok) {
                setIsServerOffline(false);
                const data = await res.json();
                const entries = Array.isArray(data) ? data : (data && Array.isArray(data.entries) ? data.entries : []);

                if (entries && entries.length > 0) {
                    setTotalGames(entries.length);
                    const guids = entries.map(e => e.UserGuid || e.userGuid).filter(Boolean);
                    const uniqueGuids = new Set(guids.map(g => g.split('-')[0]));
                    // Fallback to unique names if no GUIDs (legacy data)
                    if (uniqueGuids.size === 0) {
                        const names = entries.map(e => e.Username || e.username).filter(Boolean);
                        setTotalPlayers(new Set(names).size);
                    } else {
                        setTotalPlayers(uniqueGuids.size);
                    }

                    const currentGuid = userGuidRef.current;
                    const formatted = entries.map(e => ({
                        name: e.Username || e.username || "AGENT",
                        score: parseInt(e.Score !== undefined ? e.Score : (e.score !== undefined ? e.score : (e.Value || e.value || 0))),
                        isMine: (e.UserGuid || e.userGuid)?.startsWith(currentGuid),
                        rank: e.Rank || e.rank || 0
                    }))
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 10);

                    setLeaderboard(formatted);
                    localStorage.setItem('retromorph_leaderboard', JSON.stringify(formatted));

                    if (pendingScoresRef.current.length > 0) {
                        syncPendingScores();
                    }
                } else if (entries.length === 0) {
                    console.log("ℹ️ Server returned 0 entries. Preserving local high scores.");
                }
            } else {
                console.warn(`Leaderboard fetch rejected: ${res.status}`);
            }
        } catch (e) {
            console.error("Leaderboard Sync Failed", e);
            setIsServerOffline(true);
        } finally {
            setIsLoadingLeaderboard(false);
        }
    };

    const syncPendingScores = async () => {
        const scores = [...pendingScoresRef.current];
        if (scores.length === 0) return;

        console.log(`🔄 Attempting to sync ${scores.length} pending scores...`);
        let successCount = 0;

        for (const s of scores) {
            const formData = new FormData();
            formData.append('key', ITCH_PUBLIC_KEY);
            formData.append('username', s.name);
            formData.append('score', String(s.score));
            formData.append('extra', " ");
            // Use unique submission GUID to prevent overwriting
            formData.append('userGuid', userGuidRef.current + "-" + (s.ts || Date.now()));

            try {
                const res = await fetch(`${API_BASE}/entry/upload`, { method: 'POST', body: formData });
                if (res.ok) successCount++;
                else break;
            } catch (e) { break; }
        }

        if (successCount > 0) {
            const nextPending = pendingScoresRef.current.slice(successCount);
            setPendingScores(nextPending);
            localStorage.setItem('retromorph_pending_scores', JSON.stringify(nextPending));
            fetchGlobalLeaderboard();
        }
    };

    const initializeGuid = async () => {
        if (userGuid) return userGuid;
        try {
            const res = await fetch(`${API_BASE}/authorize`);
            if (res.ok) {
                const guid = await res.text();
                const trimmedGuid = guid.trim();
                localStorage.setItem('retromorph_guid_v3', trimmedGuid);
                setUserGuid(trimmedGuid);
                console.log("V3 Identity Authorized");
                return trimmedGuid;
            }
        } catch (e) { console.error("V3 Auth Failed", e); }
        return null;
    };

    useEffect(() => {
        initializeGuid();
    }, []);

    useEffect(() => {
        if (userGuid && (gameState === 'gameOver' || gameState === 'menu')) {
            fetchGlobalLeaderboard();
        }
    }, [gameState, userGuid]);

    const commitScore = async (name, finalScore) => {
        if (!name || name.trim().length < 3) return;

        // Final Score Safety
        const scValue = finalScore || scoreRef.current || 0;

        // Local Update (Immediate Feedback)
        setLatestScoreValue(scValue);
        setLeaderboard(prev => {
            const localEntry = { name, score: scValue, isMine: true };
            // ADDITIVE: Stop filtering by name. Keep all entries, sort, and slice.
            const updated = [localEntry, ...prev]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            localStorage.setItem('retromorph_leaderboard', JSON.stringify(updated));
            return updated;
        });

        // Global Update
        let activeGuid = userGuidRef.current;
        if (!activeGuid || activeGuid === 'null') {
            activeGuid = await initializeGuid();
        }
        if (!activeGuid) {
            console.error("Leaderboard Aborted: No GUID available");
            return;
        }

        const formData = new FormData();
        formData.append('key', ITCH_PUBLIC_KEY);
        formData.append('username', name.trim());
        formData.append('score', String(scValue));
        formData.append('extra', " ");
        // ADDITIVE: Use a unique submission GUID (OriginalGUID-Timestamp)
        formData.append('userGuid', activeGuid + "-" + Date.now());

        console.log(`📡 Committing Score: ${name} -> ${scValue}`);

        try {
            const res = await fetch(`${API_BASE}/entry/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const text = await res.text();
                console.log("✅ Server Success. Body:", text);
                setIsServerOffline(false);
                setTimeout(() => fetchGlobalLeaderboard(), 2500);
            } else {
                throw new Error(`Server Error: ${res.status}`);
            }
        } catch (e) {
            console.error("🌐 Offline? Queueing Score for later sync:", e);
            setIsServerOffline(true);
            const newPending = [...pendingScoresRef.current, { name: name.trim(), score: scValue, ts: Date.now() }];
            setPendingScores(newPending);
            localStorage.setItem('retromorph_pending_scores', JSON.stringify(newPending));
        }
    };
    const registerUser = (name) => {
        const trimmed = name?.trim() || '';
        if (trimmed.length >= 3) {
            localStorage.setItem('retromorph_username', trimmed);
            setUsername(trimmed);
            commitScore(trimmed, scoreRef.current);
            return true;
        }
        return false;
    };

    const gameOver = () => {
        const s = state.current;
        if (s.isAutoPlaying) {
            resetAI();
            return;
        }

        setGameState('gameOver');
        gameStateRef.current = 'gameOver';
        gameOverTimeRef.current = Date.now();
        setHighScore(prev => Math.max(prev, scoreRef.current));

        const activeUser = usernameRef.current;
        if (activeUser && activeUser.length >= 3) {
            commitScore(activeUser, scoreRef.current);
        }

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };

    return {
        stateRef: state,
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
    };
}

return { useRetroEngine };

/**
 * HyperScroll - High-Velocity 3D Scroller (URB Edition)
 * Ported from 96 HyperScroll to act as a cinematic finale.
 */
function HyperScroll({ dc, nodes, node, TOKENS }) {
    const { useRef, useEffect } = dc;
    const containerRef = useRef(null);
    const worldRef = useRef(null);
    const viewportRef = useRef(null);

    const engineRef = useRef({
        animationId: null,
        lastTime: 0,
        items: [],
        state: {
            scroll: 0,
            velocity: 0,
            targetSpeed: 2.5, // Constant auto-scroll speed
            mouseX: 0,
            mouseY: 0
        },
        CONFIG: {
            itemCount: 25,
            zGap: 600,
            loopSize: 0,
            camSpeed: 1.5,
            accent: TOKENS.accent
        }
    });

    useEffect(() => {
        let isActive = true;
        const { state, CONFIG, items } = engineRef.current;
        const world = worldRef.current;
        const viewport = viewportRef.current;

        if (!world || !viewport) return;

        // Reset
        world.innerHTML = '';
        items.length = 0;
        CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

        // --- Build DOM ---
        for (let i = 0; i < CONFIG.itemCount; i++) {
            const el = document.createElement('div');
            el.className = 'urb-hs-item';
            
            const card = document.createElement('div');
            card.className = 'urb-hs-card';
            
            // Cycle through actual resume node bullets for content
            const bullet = node.bullets[i % node.bullets.length] || "ARCHIVE_ENTRY_SYNCED";
            const id = Math.floor(Math.random() * 9999).toString(16).toUpperCase();

            card.innerHTML = `
                <div class="urb-hs-header">
                    <span style="color:${TOKENS.accent}; font-weight:900;">◆ [0x${id}]</span>
                    <span style="opacity:0.4; font-size:9px;">ARCHIVE_OS_V1.42</span>
                </div>
                <div class="urb-hs-body">${bullet.toUpperCase()}</div>
                <div class="urb-hs-footer">
                    <span>SECTOR_${i}</span>
                    <span>STATUS:STABLE</span>
                </div>
            `;
            
            el.appendChild(card);

            // Spiral Position
            const angle = (i / CONFIG.itemCount) * Math.PI * 4;
            const x = Math.cos(angle) * 300 + (Math.random() - 0.5) * 100;
            const y = Math.sin(angle) * 300 + (Math.random() - 0.5) * 100;
            const rot = (Math.random() - 0.5) * 20;

            items.push({ el, x, y, rot, baseZ: -i * CONFIG.zGap });
            world.appendChild(el);
        }

        // --- Styles Injection ---
        const styleId = 'urb-hs-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .urb-hs-item {
                    position: absolute;
                    left: 50%; top: 50%;
                    transform-style: preserve-3d;
                    pointer-events: none;
                }
                .urb-hs-card {
                    width: 280px;
                    padding: 25px;
                    background: rgba(5, 5, 10, 0.95);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-left: 4px solid ${TOKENS.accent};
                    backdrop-filter: none;
                    color: white;
                    font-family: ${TOKENS.font};
                    transform: translate(-50%, -50%);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                }
                .urb-hs-header { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 20px; font-family: ${TOKENS.fontMono}; letter-spacing: 1px; }
                .urb-hs-body { font-size: 14px; font-weight: 600; line-height: 1.5; opacity: 0.9; min-height: 60px; }
                .urb-hs-footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 8px; font-family: ${TOKENS.fontMono}; opacity: 0.3; }
            `;
            document.head.appendChild(style);
        }

        // --- RAF LOOP ---
        function raf(time) {
            if (!isActive) return;
            const delta = time - engineRef.current.lastTime;
            engineRef.current.lastTime = time;

            // Auto-Scroll Physics
            state.velocity += (state.targetSpeed - state.velocity) * 0.05;
            state.scroll += state.velocity;

            const cameraZ = state.scroll * CONFIG.camSpeed;
            const modC = CONFIG.loopSize;

            items.forEach(item => {
                let relZ = item.baseZ + cameraZ;
                let vizZ = ((relZ % modC) + modC) % modC;
                if (vizZ > 500) vizZ -= modC;

                let alpha = 1;
                if (vizZ < -2500) alpha = 0;
                else if (vizZ < -1500) alpha = (vizZ + 2500) / 1000;
                if (vizZ > 100) alpha = 1 - ((vizZ - 100) / 400);

                if (alpha < 0) alpha = 0;
                item.el.style.opacity = alpha;

                if (alpha > 0) {
                    item.el.style.transform = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px) rotateZ(${item.rot}deg)`;
                }
            });

            engineRef.current.animationId = requestAnimationFrame(raf);
        }

        engineRef.current.animationId = requestAnimationFrame(raf);

        return () => {
            isActive = false;
            cancelAnimationFrame(engineRef.current.animationId);
        };
    }, [node.id]);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div ref={viewportRef} style={{ position: 'absolute', inset: 0, perspective: '1000px' }}>
                <div ref={worldRef} style={{ position: 'absolute', top: '50%', left: '50%', transformStyle: 'preserve-3d' }} />
            </div>
        </div>
    );
}

const _exports = { HyperScroll };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;


function FloatingScene({ node, nodes, scroll, activeTab, isAutoPlay, dc, modules, TOKENS }) {
    const { Platform } = modules;
    const { useEffect, useRef, useState, useMemo } = Platform;
    const { THREE, gsap, TravelGlobeWidget } = modules;
    const containerRef = useRef(null);
    const sceneRefs = useRef({
        scene: null, camera: null, renderer: null, stage: null,
        layers: [], animationId: null, mouse: { x: 0, y: 0 },
        targetMouse: { x: 0, y: 0 }, lastScroll: 0
    }).current;

    const [isSceneReady, setIsSceneReady] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const dashRef = useRef(null);

    // 🏎️ SCENE INITIALIZATION
    useEffect(() => {
        if (!THREE || !containerRef.current) return;
        
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, width / height, 1, 3000);
        camera.position.z = 600;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const stage = new THREE.Group();
        scene.add(stage);

        sceneRefs.scene = scene;
        sceneRefs.camera = camera;
        sceneRefs.renderer = renderer;
        sceneRefs.stage = stage;
        
        setIsSceneReady(true);

        const onMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            sceneRefs.targetMouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
            sceneRefs.targetMouse.y = -((e.clientY - rect.top) / height) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            sceneRefs.animationId = requestAnimationFrame(animate);
            // 🏎️ ULTRA-LIQUID DAMPING: 0.012 for a massive, high-fidelity weighted feel
            sceneRefs.mouse.x += (sceneRefs.targetMouse.x - sceneRefs.mouse.x) * 0.012;
            sceneRefs.mouse.y += (sceneRefs.targetMouse.y - sceneRefs.mouse.y) * 0.012;
            
            setMousePos({ x: sceneRefs.mouse.x, y: sceneRefs.mouse.y });

            if (stage) {
                stage.rotation.y = -sceneRefs.lastScroll;
                sceneRefs.layers.forEach(mesh => {
                    const wf = mesh.userData?.wiggle || 1;
                    mesh.position.x = mesh.userData.originX + (sceneRefs.mouse.x * 12 * wf);
                    mesh.position.y = mesh.userData.originY + (sceneRefs.mouse.y * 12 * wf);
                });
            }
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            if (sceneRefs.animationId) cancelAnimationFrame(sceneRefs.animationId);
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, [THREE]);

    useEffect(() => {
        sceneRefs.lastScroll = scroll || 0;
    }, [scroll]);

    // 🎞️ BACKGROUND LAYER SYNTHESIS
    useEffect(() => {
        if (!isSceneReady || !node || !gsap) return;

        const { stage, layers } = sceneRefs;
        layers.forEach(l => stage.remove(l));
        layers.length = 0;

        const createLayer = (contentFn, zOffset, x = 0, y = 0, sizeW = 120, sizeH = 120, wiggle = 1) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            contentFn(ctx);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sizeW, sizeH), material);
            mesh.position.set(x, y, zOffset);
            mesh.userData = { originX: x, originY: y, originZ: zOffset, wiggle };
            stage.add(mesh);
            layers.push(mesh);
            return mesh;
        };

        createLayer((ctx) => {
            ctx.fillStyle = 'rgba(255,255,255,0.01)';
            ctx.font = '900 120px Inter';
            ctx.textAlign = 'center';
            const label = typeof node?.groupName === 'string' ? node.groupName : (node?.label || 'DOSSIER'); ctx.fillText(String(label).toUpperCase(), 512, 512);
        }, -150, 0, 0, 600, 600, 0.4);

        layers.forEach((mesh, i) => {
            gsap.fromTo(mesh.material, { opacity: 0 }, { opacity: 1, duration: 3, delay: i * 0.3, ease: "power2.out" });
        });

    }, [node, isSceneReady]);

    const isInitialMount = dc.useRef(true);
    const lastNodeId = dc.useRef(null);

    // 🌪️ DATA SWEEP ENTRANCE (Recap 2025 v5 - Progressive Edition)
    useEffect(() => {
        if (!dashRef.current || !gsap) return;
        
        // Detect Trigger
        const isNewNode = node?.id !== lastNodeId.current;
        if (!isNewNode && !isInitialMount.current) return;
        
        lastNodeId.current = node?.id;

        const container = dashRef.current;
        if (!container) return;

        const leftWrapper = container.querySelectorAll('.urb-entrance-buffer')[0];
        const rightWrapper = container.querySelectorAll('.urb-entrance-buffer')[1];
        const bullets = Array.from(container.querySelectorAll('.urb-content-scroll > div'));
        
        // 🛡️ GSAP TARGET SAFEGUARD
        const targets = [leftWrapper, rightWrapper].filter(Boolean);
        if (targets.length > 0) gsap.killTweensOf([...targets, ...bullets]);

        // ⏱️ DYNAMIC TIMING (Cinematic vs Snap)
        const duration = isInitialMount.current ? 3.2 : 0.8;
        const stagger = isInitialMount.current ? 0.15 : 0.05;
        const yOffset = isInitialMount.current ? 150 : 40;

        const tl = gsap.timeline({
            onComplete: () => { isInitialMount.current = false; }
        });
        
        // 1. Initial State (Focus Shift)
        if (targets.length > 0) {
            gsap.set(targets, { 
                opacity: 0, 
                y: yOffset, 
                scale: isInitialMount.current ? 0.8 : 0.98,
                rotationX: isInitialMount.current ? 20 : 5
            });
            
            // 2. High-Fidelity Deceleration
            if (leftWrapper) tl.to(leftWrapper, { 
                opacity: 1, y: 0, scale: 1, rotationX: 0,
                duration: duration, ease: "power4.out"
            }, 0.1);
            
            if (rightWrapper) tl.to(rightWrapper, { 
                opacity: 1, y: 0, scale: 1, rotationX: 0,
                duration: duration * 1.1, ease: "power4.out"
            }, 0.2);
        }

        // 3. Organic Bullet Cascade
        if (bullets.length > 0) {
            tl.fromTo(bullets, 
                { opacity: 0, x: -40 },
                { 
                    opacity: 1, x: 0, 
                    stagger: stagger, duration: duration * 0.7, 
                    ease: "power2.out"
                },
                `-=${duration * 0.8}`
            );
        }

    }, [node?.id, activeTab, isAutoPlay, gsap]);

    // 📐 LAYOUT DIMENSION INTELLIGENCE
    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            console.log(`%c 📟 [DASHBOARD_DIMENSIONS] W: ${Math.round(width)}px | H: ${Math.round(height)}px `, "background: #111; color: #a855f7; font-weight: bold; border: 1px solid #331f4d; padding: 2px 8px; border-radius: 4px;");
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    const showGlobe = activeTab === 'TRAVEL' || node?.showGlobe || node?.layout === 'tactical';
    const isAbout = node.groupName === 'IDENTITY' || node.groupName === 'ABOUT';

    const panelStyle = {
        background: 'rgba(5, 5, 10, 0.15)',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: '4px',
        color: 'white',
        boxShadow: '0 40px 100px rgba(0,0,0,0.95)',
        transition: 'transform 0.1s ease-out',
        pointerEvents: 'auto'
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* 🎞️ BACKGROUND 3D STAGE */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.8 }} />

            {/* 📟 CINEMATIC DASHBOARD */}
            <div ref={dashRef} style={{ 
                position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-start',
                paddingTop: '120px', paddingBottom: '60px',
                overflow: 'hidden'
            }}>
                {node.panelType === 'TIMELINE' && modules.TimelineSlide ? (
                    <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                        <modules.TimelineSlide node={node} dc={dc} modules={modules} TOKENS={TOKENS} />
                    </div>
                ) : (
                    <>
                        {/* Inner row — panels stretch to match each other's height */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1100px', padding: '40px 20px 0 20px' }}>
                        
                        {/* 🧠 PANEL LEFT: ARCHIVE VISUAL */}
                        <div className="urb-entrance-buffer" style={{ flex: '1 1 0', minWidth: 0, padding: '40px 24px 24px 24px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ ...panelStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    {/* Header Section */}
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: 9, color: TOKENS.accent, fontWeight: 900, letterSpacing: 3, marginBottom: 8 }}>ARCHIVE_VISUAL_0x00</div>
                                        <h2 style={{ fontSize: 24, margin: 0, color: 'white', fontWeight: 900, letterSpacing: -1 }}>SECTOR.DOSSIER</h2>
                                    </div>

                                    {/* Visual Payload Area (Fixed Centered Architecture) */}
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
                                        {showGlobe && TravelGlobeWidget ? (
                                            <div style={{ width: '320px', height: '320px', position: 'relative' }}>
                                                <TravelGlobeWidget dc={dc} modules={modules} travelData={node} TOKENS={TOKENS} />
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '10px', color: TOKENS.textMuted, letterSpacing: 8, opacity: 0.15 }}>[ SIDE_VISUAL_OFFLINE ]</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 🧠 PANEL RIGHT: INTELLIGENCE DOSSIER */}
                        <div className="urb-entrance-buffer" style={{ flex: '1 1 0', minWidth: 0, maxWidth: '500px', padding: '40px 24px 24px 24px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ 
                                ...panelStyle, flex: 1, padding: '24px', 
                                display: 'flex', flexDirection: 'column', gap: '20px'
                            }}>
                            <>
                                {/* Primary Intel Header */}
                                <div>
                                    <div style={{ color: TOKENS.accent, fontSize: '10px', fontWeight: 900, fontFamily: TOKENS.fontMono, letterSpacing: 3, marginBottom: '8px' }}>
                                        ◆ DOSSIER_INTEL // SYNC_0x{node.id?.slice(-4).toUpperCase() || 'AX'}
                                    </div>
                                    <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, fontFamily: TOKENS.font, letterSpacing: -1, lineHeight: 1.0, color: 'white' }}>
                                        {node.title.toUpperCase()}
                                    </h1>
                                </div>
                                
                                {/* Narrative & Mission Scrollable Core (Expanded Height Protocol) */}
                                <div style={{ 
                                    flex: 1, overflowY: 'auto', maxHeight: '55vh', 
                                    paddingRight: '20px', msOverflowStyle: 'none', scrollbarWidth: 'none' 
                                }}>
                                    <style>{`
                                        .urb-content-scroll::-webkit-scrollbar { width: 0; background: transparent; }
                                    `}</style>
                                    <div className="urb-content-scroll" style={{ paddingBottom: '40px' }}>
                                        {/* 🧬 NARRATIVE PAYLOAD */}
                                        {(node.panelText || node.desc) && (
                                            <div style={{ 
                                                fontSize: '17px', fontWeight: 400, fontFamily: TOKENS.font, 
                                                lineHeight: 1.6, color: 'white', marginBottom: '35px',
                                                borderRight: `1px solid rgba(255,255,255,0.05)`, paddingRight: '20px', opacity: 0.9
                                            }}>
                                                {node.panelText || node.desc}
                                            </div>
                                        )}

                                        {/* 🛠️ MISSION CRITICALS */}
                                        {node.mission && (
                                            <div style={{ marginBottom: '35px' }}>
                                                <div style={{ fontSize: '10px', color: TOKENS.accent, fontWeight: 900, fontFamily: TOKENS.fontMono, letterSpacing: 4, marginBottom: '18px', opacity: 0.8 }}>SYSTEM_MISSION_SEQUENCE</div>
                                                {node.mission.split('➔').map(s => s.trim()).filter(Boolean).map((part, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px', fontSize: '15px', fontWeight: 600, color: 'white' }}>
                                                        <span style={{ color: TOKENS.accent }}>➔</span> {part}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 📋 BACKLOG DATA */}
                                        {node.bullets?.length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <div style={{ fontSize: '9px', color: TOKENS.textMuted, letterSpacing: 3, marginBottom: '20px' }}>SUPPLEMENTARY_DATA_STREAM</div>
                                                {node.bullets.map((b, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '15px' }}>
                                                        <span style={{ color: TOKENS.accent, fontWeight: 900, fontSize: '13px' }}>&gt;&gt;</span>
                                                        <span style={{ fontSize: '14px', fontWeight: 400, fontFamily: TOKENS.font, lineHeight: 1.5, color: 'rgba(255,255,255,0.4)' }}>{b.toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cinematic Status Badge Base (Stabilized at bottom) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div>
                                        {node.trigger && (
                                            <div style={{ fontSize: '9px', fontFamily: TOKENS.fontMono, color: TOKENS.textMuted, letterSpacing: 2 }}>
                                                TRIGGER: <span style={{ color: TOKENS.accent, fontWeight: 900 }}>{node.trigger.toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div style={{ fontSize: '8px', color: TOKENS.textMuted, marginTop: '4px', letterSpacing: 1 }}>SYSTEM_AUTO_SAFE: ON</div>
                                    </div>
                                    <div className="fade-in" style={{ padding: '12px 24px', color: 'white', background: TOKENS.accent, fontSize: '10px', fontWeight: 900, fontFamily: TOKENS.fontMono, letterSpacing: 3, border: `1px solid white`, boxShadow: `0 10px 30px ${TOKENS.accent}44` }}>
                                        {isAbout ? 'LOGIN_SUCCESS' : 'DATA_STABLE'}
                                    </div>
                                </div>
                            </>
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>

    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.08) 0%, transparent 85%)', pointerEvents: 'none' }} />
</div>
    );
}

const _exports = { FloatingScene };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;


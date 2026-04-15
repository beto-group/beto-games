// ─────────────────────────────────────────────────────────────
// 🎞️ COMPONENT: NODEGRAPH ENGINE (Cinematic Top-Left Orbit)
// ─────────────────────────────────────────────────────────────

function NodeGraph({ data, dc, modules, focusedNode, onNodeFocus, onScrollChange, TOKENS, controlRef }) {
    const { useEffect, useRef, useState, useMemo } = dc;
    const { THREE, gsap } = modules;
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const rotationRef = useRef(0);
    const targetRotationRef = useRef(0);
    const corePulseRef = useRef(0);
    const lastFocusIdRef = useRef(null);
    const locationRef = useRef("BETO_CORE");
    
    // 🧬 GPU ACCELERATED REFERENCES
    const threeRefs = useRef({ scene: null, camera: null, renderer: null, instancedHubs: null, orbits: [] });

    // 🏎️ GPU INITIALIZATION (Three.js WebGL)
    useEffect(() => {
        if (!THREE || !containerRef.current) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, width / height, 1, 3000);
        camera.position.z = 800;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.insertBefore(renderer.domElement, container.firstChild);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.inset = '0';
        renderer.domElement.style.zIndex = '1';

        threeRefs.current = { scene, camera, renderer, instancedHubs: null, orbits: [] };

        const animate = () => {
            threeRefs.current.animationId = requestAnimationFrame(animate);
            if (threeRefs.current.instancedHubs) {
                // Orbital Physics Handle in Main Render Loop
            }
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(threeRefs.current.animationId);
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, [THREE]);

    const items = useMemo(() => {
        const { width, height } = dimensions;
        if (!height || !width) return { yearSegments: [], monthHubs: [], itemHubs: [], radii: {} };
        const s = Math.max(0.7, Math.min(1.3, (height / 900))) * 0.9;
        
        // 🛰️ RECAP 2025 RADII (EXPANDED)
        const R_YEAR = 90 * s, R_MONTH = 220 * s, R_ITEM = 430 * s;
        
        const ITEM_GAP = 0.35, GROUP_GAP = 0.2, YEAR_GAP = 0.69;
        let curAng = 0;
        const ySegs = [], mHubs = [], iHubs = [];
        const virtualYear = "ARCHIVE";
        
        const startAng = curAng;
        data?.groups?.forEach(g => {
            g.items.forEach((it, idx) => {
                const ang = curAng;
                iHubs.push({ ...it, angle: ang, year: virtualYear, parentId: `m-${virtualYear}-${g.name}` });
                curAng += ITEM_GAP;
            });
            curAng += GROUP_GAP;
            mHubs.push({ id: `m-${virtualYear}-${g.name}`, angle: iHubs[iHubs.length-1]?.angle || curAng, name: g.name.toUpperCase(), year: virtualYear });
        });
        ySegs.push({ year: virtualYear, start: startAng, end: curAng - YEAR_GAP });

        // 🧬 UPDATE GPU GEOMETRIES
        if (threeRefs.current.scene) {
            const { scene } = threeRefs.current;
            // Cleanup old
            if (threeRefs.current.instancedHubs) scene.remove(threeRefs.current.instancedHubs);
            threeRefs.current.orbits.forEach(o => scene.remove(o));
            threeRefs.current.orbits = [];

            // Orbits
            const createOrbit = (r) => {
                const geometry = new THREE.BufferGeometry();
                const points = [];
                for (let i = 0; i <= 64; i++) {
                    const a = (i / 64) * Math.PI * 2;
                    points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
                }
                geometry.setFromPoints(points);
                const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }));
                scene.add(line);
                threeRefs.current.orbits.push(line);
            };
            createOrbit(R_MONTH); createOrbit(R_ITEM);

            // Hubs (Instanced)
            const hubGeo = new THREE.CircleGeometry(5, 12);
            const hubMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
            const instancedHubs = new THREE.InstancedMesh(hubGeo, hubMat, iHubs.length);
            scene.add(instancedHubs);
            threeRefs.current.instancedHubs = instancedHubs;
        }
        
        return { yearSegments: ySegs, monthHubs: mHubs, itemHubs: iHubs, radii: { R_YEAR, R_MONTH, R_ITEM }, scaleFactor: s };
    }, [data, dimensions]);

    // 🏎️ EXPOSE CONTROL (Custom Implementation - Datacore Compatibility)
    useEffect(() => {
        if (controlRef) {
            controlRef.current = {
                spin: (delta) => {
                    // 🛡️ RECAP 2025 GOLDEN PHYSICS (1:1 PORT + BOUNDARY CLAMP)
                    let nextRot = targetRotationRef.current - (delta * 0.0006);
                    
                    // Boundary Guardians
                    const totalItems = items.itemHubs || [];
                    if (totalItems.length > 0) {
                        const minAng = 0;
                        const maxAng = totalItems[totalItems.length - 1].angle;
                        nextRot = Math.max(minAng, Math.min(maxAng, nextRot));
                    }

                    targetRotationRef.current = nextRot;
                    corePulseRef.current = Math.min(1.0, corePulseRef.current + 0.1);
                }
            };
        }
    }, [controlRef, items]);

    // Sync focusedNode to target rotation (Hard Snap for Robustness)
    useEffect(() => {
        if (focusedNode && focusedNode.angle !== undefined) {
            targetRotationRef.current = focusedNode.angle;
        }
    }, [focusedNode]);

    // 🌀 TRANSITION MOMENTUM (Recap 2025 Logic)
    useEffect(() => {
        if (!focusedNode) return;
        // Trigger High-Energy Pulse on Node Change
        corePulseRef.current = 1.8;
        // Inject Momentum Kick
        targetRotationRef.current += (Math.random() > 0.5 ? 0.05 : -0.05);
    }, [focusedNode?.id]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const obs = new ResizeObserver(entries => {
            if (!entries[0]) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
            if (threeRefs.current.renderer) {
                threeRefs.current.renderer.setSize(width, height);
                threeRefs.current.camera.aspect = width / height;
                threeRefs.current.camera.updateProjectionMatrix();
            }
        });
        obs.observe(container);

        return () => { 
            obs.disconnect(); 
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !dimensions.width) return;
        const ctx = canvas.getContext('2d'), { width, height } = dimensions;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);

        const render = () => {
            const time = Date.now() * 0.0006;
            const { yearSegments, monthHubs, itemHubs, radii, scaleFactor: s } = items;
            const { R_YEAR, R_MONTH, R_ITEM } = radii || {};
            
            // 🌀 RECAP 2025 MOMENTUM (0.1 DAMPING)
            rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.1;
            const scroll = rotationRef.current;
            corePulseRef.current *= 0.95;

            if (typeof onScrollChange === 'function') onScrollChange(scroll);

            // 🧬 UPDATE GPU INSTANCES
            if (threeRefs.current.instancedHubs) {
                const matrix = new THREE.Matrix4();
                const pivotX = -width / 2 - 150 * s; // Shifted Left to clear HUD
                const pivotY = height / 2 - height * 0.12; 

                itemHubs.forEach((ih, i) => {
                    const ang = (ih.angle - scroll) % 6.28;
                    const d = Math.abs(ang > Math.PI ? ang - 6.28 : (ang < -Math.PI ? ang + 6.28 : ang));
                    const op = Math.pow(Math.max(0, 1 - d * 2.5), 2);
                    const isF = focusedNode?.id === ih.id;

                    matrix.makeTranslation(Math.cos(ang) * R_ITEM + pivotX, Math.sin(ang) * R_ITEM + pivotY, 0);
                    threeRefs.current.instancedHubs.setMatrixAt(i, matrix);
                    threeRefs.current.instancedHubs.setColorAt(i, new THREE.Color(isF ? TOKENS.accent : 0xffffff));
                });
                threeRefs.current.instancedHubs.instanceMatrix.needsUpdate = true;
                if (threeRefs.current.instancedHubs.instanceColor) threeRefs.current.instancedHubs.instanceColor.needsUpdate = true;
            }

            const getPos = (ang) => {
                let d = (ang - scroll) % 6.28;
                if (d > 3.14) d -= 6.28;
                if (d < -3.14) d += 6.28;
                return { ang: d, x: Math.cos(d), y: Math.sin(d), dist: d };
            };

            // 🧲 TACTILE NOTCH (Strong Magnetic Attraction)
            let fItem = null, minDist = 999;
            itemHubs.forEach(ih => {
                const pos = getPos(ih.angle);
                if (Math.abs(pos.dist) < minDist) {
                    minDist = Math.abs(pos.dist);
                    fItem = ih;
                }
            });

            ctx.clearRect(0, 0, width, height);
            ctx.save();
            
            // 📐 CINEMATIC PIVOT (Top-Left - Recap 2025 Pattern)
            ctx.translate(0, height * 0.1);

            // ⭕ RECAP 2025: ORIGIN ORB + ROTATING RING SYSTEM
            ctx.save();
            const cr = (55 + corePulseRef.current * 25) * s;
            ctx.rotate(time * 0.3);
            ctx.strokeStyle = `rgba(255,255,255,${0.15 + corePulseRef.current * 0.4})`;
            ctx.lineWidth = (1 + corePulseRef.current * 1.5) * s;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI;
                ctx.beginPath();
                ctx.ellipse(0, 0, cr, cr * Math.abs(Math.sin(time + a)), time + a, 0, 6.28);
                ctx.stroke();
            }
            // Inner pulsing orb (white core)
            ctx.beginPath();
            ctx.arc(0, 0, (15 + corePulseRef.current * 10) * s, 0, 6.28);
            ctx.fillStyle = `rgba(255,255,255,${0.4 + corePulseRef.current * 0.6})`;
            ctx.fill();
            ctx.restore();

            // Static orbit rings
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1 * s;
            [R_MONTH, R_ITEM].forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.stroke(); });
            ctx.strokeStyle = 'rgba(168,85,247,0.12)'; ctx.setLineDash([5 * s, 15 * s]);
            ctx.beginPath(); ctx.arc(0, 0, R_YEAR * 1.5, 0, 6.28); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // 📅 ACTIVE YEAR ARCS
            yearSegments.forEach(seg => {
                const sa = getPos(seg.start), ea = getPos(seg.end);
                // Only draw if within reasonable view
                if (Math.abs(sa.dist) > 2.5 && Math.abs(ea.dist) > 2.5) return;
                
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.1})`; 
                ctx.lineWidth = 3 * s;
                ctx.beginPath(); ctx.arc(-150 * s, 0, R_YEAR, sa.ang, ea.ang); ctx.stroke();
                
                // Year Label on Arc
                const lp = getPos(seg.start + 0.15);
                ctx.save();
                ctx.translate(lp.x * R_YEAR - 150 * s, lp.y * R_YEAR);
                ctx.rotate(0); // Restore horizontal/upright alignment
                
                // --- PRIMARY NAV LABEL --- (Sublimated for Dossier Focus)
                ctx.fillStyle = focusedNode ? 'rgba(168, 85, 247, 0.4)' : TOKENS.accent;
                ctx.font = `900 ${18 * s}px ${TOKENS.font}`;
                ctx.textAlign = 'center';
                ctx.fillText(seg.year, 0, 0);
                
                // --- TACTICAL SEPARATOR ---
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1 * s;
                ctx.beginPath();
                ctx.moveTo(-30 * s, 25 * s);
                ctx.lineTo(30 * s, 25 * s);
                ctx.stroke();

                // --- SUB-LABEL (LEGIBILITY FIX) ---
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.font = `700 ${10 * s}px ${TOKENS.fontMono}`;
                ctx.fillText("▶ SYSTEM_MANIFEST", 0, 45 * s);
                ctx.restore();
            });

            // 📡 DRAWING LOOP & TACTICAL DATA
            itemHubs.forEach(ih => {
                const pos = getPos(ih.angle);
                const d = Math.abs(pos.dist);

                if (d > 1.2) return;
                
                const isF = focusedNode?.id === ih.id;
                const op = isF ? 1 : Math.pow(Math.max(0, 1 - d * 2.5), 2);
                const ix = pos.x * R_ITEM, iy = pos.y * R_ITEM;

                // Tactical Scanners
                if (isF && d < 0.5) {
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ix, iy);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${op * 0.3})`; ctx.lineWidth = 0.5*s; ctx.stroke();
                    
                    // Binary Pulse (Sync with Recap 2025)
                    ctx.fillStyle = `rgba(168, 85, 247, ${op * 0.8})`; 
                    ctx.font = `900 ${7 * s}px monospace`;
                    for (let i = 0; i < 8; i++) {
                        const t = (i / 8 + time * 1.8) % 1;
                        ctx.fillText(i % 2 === 0 ? "1" : "0", ix * t, iy * t);
                    }
                }

                // Item dot — clean fill, no shadow blur (Recap2025 line 312 exact)
                ctx.beginPath(); ctx.arc(ix, iy, (isF ? 18 : 8) * s, 0, 6.28);
                ctx.fillStyle = isF ? TOKENS.accent : `rgba(168, 85, 247, ${op * 0.6})`;
                ctx.fill();

                if (d < 0.25) {
                    ctx.save(); ctx.translate(ix, iy); ctx.rotate(pos.ang);
                    
                    // 📏 DYNAMIC TEXT SCALING (Collision Prevention)
                    const titleStr = (ih.title || '').toUpperCase();
                    const lenScale = titleStr.length > 12 ? Math.max(0.5, 1 - (titleStr.length - 12) * 0.05) : 1.0;
                    const textOp = isF ? (focusedNode ? 0.4 : 0.8) : (op * 0.15);
                    
                    ctx.fillStyle = `rgba(255,255,255,${textOp})`;
                    ctx.font = `${isF ? 900 : 400} ${isF ? (24*s*lenScale) : (14*s*lenScale)}px ${TOKENS.font}`;
                    
                    const yOffset = (isF && titleStr.length > 10) ? 10 * s : 5 * s;
                    ctx.fillText(titleStr, (isF ? 28 : 16)*s, yOffset);
                    ctx.restore();
                }
            });

            // 📡 TELEMETRY HUD (STRICT RECAP 2025 REPLICATION)
            ctx.restore();
            const hs = s * 0.8, rm = 60 * hs;
            ctx.textAlign = 'right';
            
            let activeYear = fItem?.year || "2025";
            const labelText = "DOSSIER"; 
            
            ctx.fillStyle = TOKENS.accent; 
            ctx.font = `900 ${12 * hs}px ${TOKENS.fontMono}`;
            ctx.fillText("BETO_OS", width - rm, 45 * hs);

            ctx.fillStyle = 'rgba(255,255,255,1)'; 
            ctx.font = `900 ${72 * hs}px ${TOKENS.font}`;
            ctx.fillText(labelText, width - rm, 105 * hs);
            
            // betoCode Streams (Dynamic)
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; 
            ctx.font = `700 ${11 * hs}px ${TOKENS.fontMono}`;
            for(let i=0; i<3; i++) {
                const seed = Math.floor(time * 10) + i;
                const code = "D.q.0x" + ((seed * 1337) % 65535).toString(16).toUpperCase().padStart(4, '0');
                ctx.fillText(`• ${code}`, width - rm, 125 * hs + (i * 18 * hs));
            }

            // Location Sync
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = `900 ${10 * hs}px ${TOKENS.fontMono}`;
            ctx.fillText(locationRef.current, width - rm, 65 * hs);

            // 📡 FOCUS EMISSION (Input -> Rotation -> Focus)
            if (fItem && minDist < 0.28) {
                if (lastFocusIdRef.current !== fItem.id) {
                    lastFocusIdRef.current = fItem.id;
                    corePulseRef.current = 1.0;
                    if (onNodeFocus) onNodeFocus(fItem);
                    // Update location based on data if available
                    if (fItem.location) locationRef.current = fItem.location.toUpperCase();
                }
            } else if (minDist > 0.4 && lastFocusIdRef.current) {
                // Keep Focus until something else takes over or it's too far
            }

            frameId = requestAnimationFrame(render);
        };
        let frameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frameId);
    }, [items, dimensions, focusedNode, onNodeFocus]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
    );
}

const _exports = { NodeGraph };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;


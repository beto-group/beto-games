
function TravelGlobeWidget({ dc, modules, travelData, TOKENS }) {
    const { useState, useEffect, useRef } = dc;
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [ready, setReady] = useState(false);

    // Drag state
    const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
    // Globe rotation state [lambda, phi] (longitude, latitude offset)
    const rotRef = useRef([96, -55]); // Default: Starts facing Canada

    // Country IDs from Natural Earth / world-atlas 110m
    // Canada = 124, USA = 840
    // Thailand = 764, Vietnam = 704, Laos = 418, Cambodia = 116, Myanmar = 104, Malaysia = 458
    const CANADA_IDS = new Set([124]);
    const ASIA_IDS = new Set([764, 704, 418, 116, 104, 458, 702, 764]);

    async function _loadScript(url, globalName) {
        if (window[globalName]) return window[globalName];
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.onload = () => resolve(window[globalName]);
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    useEffect(() => {
        let active = true;
        async function init() {
            try {
                await Promise.all([
                    _loadScript("https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", 'd3'),
                    _loadScript("https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js", 'topojson')
                ]);
                if (active) setReady(true);
            } catch (e) { console.error("[GlobeWidget] Init failed", e); }
        }
        init();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!ready || !containerRef.current || !window.d3) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const d3 = window.d3;
        const topojson = window.topojson;
        const dpr = window.devicePixelRatio || 1;
        let animId;
        let width, height;
        let worldData, countryFeatures;

        const projection = d3.geoOrthographic().clipAngle(90).precision(0.3);
        const path = d3.geoPath(projection, ctx);

        const updateSize = () => {
            if (!containerRef.current) return;
            width = containerRef.current.clientWidth;
            height = containerRef.current.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        updateSize();

        // ─── DRAG INTERACTION ────────────────────────────────────────
        const el = containerRef.current;

        const onMouseDown = (e) => {
            dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
            el.style.cursor = 'grabbing';
        };
        const onMouseMove = (e) => {
            if (!dragRef.current.active) return;
            const dx = e.clientX - dragRef.current.lastX;
            const dy = e.clientY - dragRef.current.lastY;
            rotRef.current[0] += dx * 0.4;
            rotRef.current[1] -= dy * 0.4;
            rotRef.current[1] = Math.max(-85, Math.min(85, rotRef.current[1]));
            dragRef.current.lastX = e.clientX;
            dragRef.current.lastY = e.clientY;
        };
        const onMouseUp = () => {
            dragRef.current.active = false;
            el.style.cursor = 'grab';
        };
        // Touch support
        const onTouchStart = (e) => {
            const t = e.touches[0];
            dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY };
        };
        const onTouchMove = (e) => {
            if (!dragRef.current.active) return;
            const t = e.touches[0];
            const dx = t.clientX - dragRef.current.lastX;
            const dy = t.clientY - dragRef.current.lastY;
            rotRef.current[0] += dx * 0.4;
            rotRef.current[1] -= dy * 0.4;
            rotRef.current[1] = Math.max(-85, Math.min(85, rotRef.current[1]));
            dragRef.current.lastX = t.clientX;
            dragRef.current.lastY = t.clientY;
        };
        el.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: true });
        el.addEventListener('touchend', onMouseUp);
        el.style.cursor = 'grab';

        // ─── FETCH WORLD DATA ────────────────────────────────────────
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(r => r.json())
            .then(world => {
                worldData = topojson.feature(world, world.objects.countries);
                countryFeatures = worldData.features;

                // ─── INTRO ANIMATION SEQUENCE ───
                const CANADA_ROT = [96, -55]; // Facing Canada
                const ASIA_ROT = [-102, -15]; // Facing SE Asia
                const introStartTime = Date.now();
                const WAIT_DURATION = 2000;  // 2-second pause at start
                const INTRO_DURATION = 4500; // 4.5-second rotation

                const draw = () => {
                    if (!width || !height) { animId = requestAnimationFrame(draw); return; }

                    // Intro Animation Logic
                    const now = Date.now();
                    const elapsed = now - introStartTime;
                    
                    if (elapsed > WAIT_DURATION && elapsed < (WAIT_DURATION + INTRO_DURATION) && !dragRef.current.active) {
                        const t = d3.easeCubicInOut((elapsed - WAIT_DURATION) / INTRO_DURATION);
                        rotRef.current[0] = CANADA_ROT[0] + (ASIA_ROT[0] - CANADA_ROT[0]) * t;
                        rotRef.current[1] = CANADA_ROT[1] + (ASIA_ROT[1] - CANADA_ROT[1]) * t;
                    }
                    const [lambda, phi] = rotRef.current;
                    const baseScale = Math.min(width, height) * 0.46;
                    projection.scale(baseScale).translate([width / 2, height / 2]).rotate([lambda, phi]);

                    ctx.clearRect(0, 0, width, height);

                    // ── Globe base ──
                    ctx.beginPath(); path({ type: "Sphere" });
                    ctx.fillStyle = "rgba(5,5,12,0.98)"; ctx.fill();
                    ctx.strokeStyle = "rgba(168,85,247,0.15)"; ctx.lineWidth = 1; ctx.stroke();

                    // ── Graticule ──
                    const graticule = d3.geoGraticule()();
                    ctx.beginPath(); path(graticule);
                    ctx.strokeStyle = "rgba(168,85,247,0.04)"; ctx.lineWidth = 0.4; ctx.stroke();

                    // ── Countries ──
                    countryFeatures.forEach(feature => {
                        const id = +feature.id;
                        const isCanada = CANADA_IDS.has(id);
                        const isAsia = ASIA_IDS.has(id);

                        ctx.beginPath(); path(feature);

                        if (isCanada) {
                            ctx.fillStyle = "rgba(168,85,247,0.22)";
                            ctx.strokeStyle = "rgba(168,85,247,0.9)";
                            ctx.lineWidth = 1.2;
                        } else if (isAsia) {
                            ctx.fillStyle = "rgba(100,200,255,0.18)";
                            ctx.strokeStyle = "rgba(100,200,255,0.8)";
                            ctx.lineWidth = 1.2;
                        } else {
                            ctx.fillStyle = "rgba(168,85,247,0.03)";
                            ctx.strokeStyle = "rgba(168,85,247,0.18)";
                            ctx.lineWidth = 0.4;
                        }
                        ctx.fill(); ctx.stroke();
                    });

                    // ── Labels: Canada HOME ──
                    const canadaCenter = projection([-96, 60]);
                    if (canadaCenter) {
                        const [cx, cy] = canadaCenter;
                        if (cx > 0 && cx < width && cy > 0 && cy < height) {
                            ctx.save();
                            ctx.fillStyle = "rgba(168,85,247,0.95)";
                            ctx.font = `900 10px monospace`;
                            ctx.textAlign = 'center';
                            ctx.fillText("◆ HOME", cx, cy - 4);
                            ctx.restore();
                        }
                    }

                    // ── Label: Southeast Asia CURRENT ──
                    const asiaCenter = projection([102, 15]);
                    if (asiaCenter) {
                        const [ax, ay] = asiaCenter;
                        if (ax > 0 && ax < width && ay > 0 && ay < height) {
                            ctx.save();
                            ctx.fillStyle = "rgba(100,200,255,0.95)";
                            ctx.font = `900 10px monospace`;
                            ctx.textAlign = 'center';
                            ctx.fillText("◆ CURRENT", ax, ay - 4);
                            ctx.restore();
                        }
                    }

                    // ── Arc: Canada → Thailand ──
                    const p1 = [-96, 60];  // Canada
                    const p2 = [100.5, 13.75]; // Thailand
                    ctx.beginPath();
                    path({ type: "LineString", coordinates: [p1, p2] });
                    ctx.strokeStyle = "rgba(168,85,247,0.25)";
                    ctx.setLineDash([4, 6]);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Origin dot (Canada)
                    const sp = projection(p1);
                    if (sp) { ctx.beginPath(); ctx.arc(sp[0], sp[1], 4, 0, 6.28); ctx.fillStyle = "rgba(168,85,247,1)"; ctx.fill(); }

                    // Dest dot (Thailand)
                    const ep = projection(p2);
                    if (ep) { ctx.beginPath(); ctx.arc(ep[0], ep[1], 4, 0, 6.28); ctx.fillStyle = "rgba(100,200,255,1)"; ctx.fill(); }

                    animId = requestAnimationFrame(draw);
                };
                draw();
            })
            .catch(e => console.error("[GlobeWidget] World data fetch failed", e));

        return () => {
            if (animId) cancelAnimationFrame(animId);
            observer.disconnect();
            el.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onMouseUp);
        };
    }, [ready]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', userSelect: 'none' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            {/* Legend */}
            <div style={{
                position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 16, pointerEvents: 'none', zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(168,85,247,1)', display: 'block' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(168,85,247,0.9)', letterSpacing: 2 }}>HOME // CANADA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(100,200,255,1)', display: 'block' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(100,200,255,0.9)', letterSpacing: 2 }}>CURRENT // ASIA</span>
                </div>
            </div>
            {/* Drag hint */}
            <div style={{
                position: 'absolute', top: 8, right: 10,
                fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, pointerEvents: 'none'
            }}>DRAG TO ROTATE</div>
        </div>
    );
}

return { TravelGlobeWidget };

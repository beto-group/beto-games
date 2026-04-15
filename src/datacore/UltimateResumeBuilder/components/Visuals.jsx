const PARTICLE_VERTEX = `
    varying vec2 vUv;
    varying float vOpacity;
    uniform float uTime;
    attribute float aSize;
    attribute float aSpeed;
    attribute float aOffset;

    void main() {
        vUv = uv;
        vec3 pos = position;
        float angle = uTime * aSpeed + aOffset;
        pos.x += cos(angle) * 20.0;
        pos.y += sin(angle) * 20.0;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vOpacity = 0.1 + sin(uTime * aSpeed + aOffset) * 0.1;
    }
`;

const PARTICLE_FRAGMENT = `
    varying float vOpacity;
    uniform vec3 uColor;

    void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, vOpacity * (1.0 - d * 2.0));
    }
`;

function GeometricParticles({ dc, modules, TOKENS }) {
    const { useEffect, useRef } = dc;
    const { THREE } = modules;
    const containerRef = useRef(null);

    useEffect(() => {
        if (!THREE || !containerRef.current) return;
        
        const container = containerRef.current;
        const width = container.clientWidth, height = container.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
        camera.position.z = 500;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // 🧬 GEOMETRIC BUFFER ENGINE
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const speeds = new Float32Array(count);
        const offsets = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
            sizes[i] = 1.0 + Math.random() * 4.0;
            speeds[i] = 0.1 + Math.random() * 0.5;
            offsets[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(TOKENS.accent) }
            },
            vertexShader: PARTICLE_VERTEX,
            fragmentShader: PARTICLE_FRAGMENT,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        let animationId;
        const render = (time) => {
            material.uniforms.uTime.value = time * 0.001;
            points.rotation.y = time * 0.00005;
            renderer.render(scene, camera);
            animationId = requestAnimationFrame(render);
        };
        render(0);

        return () => {
            cancelAnimationFrame(animationId);
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, [THREE]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 40%, #000 100%)', zIndex: 1 }} />
        </div>
    );
}

function TravelGlobeWidget({ dc, modules, travelData, TOKENS }) {
    const { useEffect, useRef, useState } = dc;
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let active = true;
        async function init() {
            try {
                await Promise.all([
                    modules.loadScript(dc, "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js", { globalName: 'd3' }),
                    modules.loadScript(dc, "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js", { globalName: 'topojson' })
                ]);
                if (active) setReady(true);
            } catch (e) { console.error('[URB Globe] Resources failed:', e); }
        }
        init();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!ready || !containerRef.current || !window.d3) return;
        const canvas = canvasRef.current, ctx = canvas.getContext('2d'), d3 = window.d3;
        const dpr = window.devicePixelRatio || 1;
        let width, height, animId;
        const projection = d3.geoOrthographic().clipAngle(90);
        const path = d3.geoPath(projection, ctx);

        const updateSize = () => {
            width = containerRef.current.clientWidth; height = containerRef.current.clientHeight;
            canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr);
        };
        updateSize();

        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(r => r.json()).then(world => {
                const countries = window.topojson.feature(world, world.objects.countries);
                const render = () => {
                    ctx.clearRect(0, 0, width, height);
                    projection.rotate([Date.now() * 0.012, -20]);
                    projection.scale(Math.min(width, height) * 0.42).translate([width/2, height/2]);
                    
                    // Atmosphere Glow
                    ctx.beginPath(); path({ type: "Sphere" }); 
                    ctx.fillStyle = "rgba(168, 85, 247, 0.05)"; ctx.fill();
                    
                    ctx.beginPath(); path({ type: "Sphere" }); 
                    ctx.fillStyle = "rgba(10,10,10,0.9)"; ctx.fill();
                    ctx.strokeStyle = "rgba(168,85,247,0.4)"; ctx.lineWidth = 1; ctx.stroke();
                    
                    // Countries
                    ctx.beginPath(); path(countries); 
                    ctx.fillStyle = "rgba(255,255,255,0.02)"; ctx.fill();
                    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 0.5; ctx.stroke();
                    
                    animId = requestAnimationFrame(render);
                };
                render();
            });
        return () => cancelAnimationFrame(animId);
    }, [ready]);

    return (
        <div ref={containerRef} className="urb-globe-shell fade-in" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Travel Metadata HUD */}
            <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: 7, color: TOKENS.accent, fontWeight: 900, letterSpacing: 4, marginBottom: 8 }}>TACTICAL_DEPLOYMENT: TRAVEL_LOG</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -1, color: 'white', lineHeight: 1.1 }}>{travelData?.title?.toUpperCase()}</h2>
                
                <div style={{ display: 'flex', gap: 40, marginTop: 30, justifyContent: 'center' }}>
                    {travelData?.bullets?.map((b, i) => (
                        <div key={i} style={{ border: `1px solid ${TOKENS.border}`, padding: '15px 25px', borderRadius: 4, background: 'rgba(0,0,0,0.5)' }}>
                            <div style={{ fontSize: 9, color: TOKENS.textMuted, marginBottom: 5 }}>LOCATION_DATA</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{b}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const _exports = { GeometricParticles, TravelGlobeWidget };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;


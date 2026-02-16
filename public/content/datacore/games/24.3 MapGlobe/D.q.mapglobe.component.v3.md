
### ViewComponent

```jsx
// --- Helper: Dynamic Script/Style Loader (CSP-Safe) ---
async function loadLibrary(dc, url, type = 'js') {
    if (type === 'js') {
        const existing = document.querySelector(`script[src="${url}"]`);
        if (existing) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    } else {
        const id = `style-${url.replace(/[^a-z0-9]/gi, '-')}`;
        if (document.getElementById(id)) return;
        
        try {
            // CSP Bypass: Fetch CSS and inject as inline style
            const response = await fetch(url);
            const cssText = await response.text();
            const style = document.createElement('style');
            style.id = id;
            style.textContent = cssText;
            document.head.appendChild(style);
        } catch (err) {
            console.error("Failed to load CSP-safe CSS:", err);
            throw err;
        }
    }
}

// --- Map Component (Ultra-Stable Debug Version) ---
const Map = ({
    center = [0, 20],
    zoom = 1.5,
    style,
    className = '',
    children,
    onMapLoad,
    ...props
}) => {
    const containerRef = dc.useRef(null);
    const mapRef = dc.useRef(null);
    const [status, setStatus] = dc.useState('Initialising...');

    dc.useEffect(() => {
        let mounted = true;

        async function init() {
            if (typeof window === 'undefined' || !containerRef.current) return;
            if (mapRef.current) return;

            try {
                setStatus('Loading MapLibre Assets...');
                // Load assets sequentially for stability
                await loadLibrary(dc, 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css', 'css');
                await loadLibrary(dc, 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js');
                
                if (!mounted || !window.maplibregl) return;

                setStatus('Initializing WebGL...');
                const map = new window.maplibregl.Map({
                    container: containerRef.current,
                    style: style,
                    center: center,
                    zoom: zoom,
                    projection: 'mercator',
                    attributionControl: false,
                    ...props
                });

                map.on('load', () => {
                    if (mounted) {
                        setStatus(''); // Success
                        map.resize();
                        if (onMapLoad) onMapLoad(map);
                    }
                });

                map.on('error', (e) => {
                    console.error("MapLibre Render Error:", e);
                    if (mounted) setStatus(`Render Error: ${e.error?.message || 'Check Console'}`);
                });

                mapRef.current = map;
            } catch (err) {
                console.error("[MapGlobe] Map init failed:", err);
                if (mounted) setStatus(`Init Failed: ${err.message}`);
            }
        }

        init();
        return () => { mounted = false; };
    }, []);

    const STYLES = {
        wrapper: {
            width: '100%',
            height: '600px',
            backgroundColor: '#0a0a0a',
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #1a1a2a'
        },
        container: { width: '100%', height: '100%' },
        status: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#8b5cf6',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            padding: '4px 12px',
            borderRadius: '20px',
            pointerEvents: 'none'
        }
    };

    return (
        <div style={STYLES.wrapper} className={className}>
            {status && <div style={STYLES.status}>{status}</div>}
            <div ref={containerRef} style={STYLES.container} />
            {children}
        </div>
    );
};

// --- MapMarker Component ---
const MapMarker = ({ map, longitude, latitude, children }) => {
    const markerRef = dc.useRef(null);
    const contentRef = dc.useRef(null);

    dc.useEffect(() => {
        if (!map || !window.maplibregl) return;

        const el = document.createElement('div');
        const marker = new window.maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map);

        markerRef.current = marker;
        return () => marker.remove();
    }, [map, longitude, latitude]);

    dc.useEffect(() => {
        if (markerRef.current && contentRef.current) {
            const el = markerRef.current.getElement();
            el.innerHTML = '';
            el.appendChild(contentRef.current);
        }
    }, [children]);

    return (
        <div style={{ display: 'none' }}>
            <div ref={contentRef}>{children}</div>
        </div>
    );
};

function View(props) {
    const [threats, setThreats] = dc.useState([]);
    const [mapInstance, setMapInstance] = dc.useState(null);
    const [lang, setLang] = dc.useState('AR');
    const [isSettingsOpen, setIsSettingsOpen] = dc.useState(false);
    const [mapOpacity, setMapOpacity] = dc.useState(0.8);

    const TRANSLATIONS = {
        EN: { simulate: "+ SIMULATE THREAT", settings: "Settings", language: "Language", darkness: "Map Intensity", ip: "IP", risk: "Risk" },
        AR: { simulate: "+ محاكاة التهديد", settings: "الإعدادات", language: "اللغة", darkness: "كثافة الخريطة", ip: "عنوان IP", risk: "المخاطر" }
    };

    const t = TRANSLATIONS[lang];

    const getRiskColor = (risk) => {
        const r = Math.floor(139 + (risk * (236 - 139) / 100));
        const g = Math.floor(92 + (risk * (72 - 92) / 100));
        const b = Math.floor(246 + (risk * (153 - 246) / 100));
        return `rgb(${r}, ${g}, ${b})`;
    };

    const addRandomThreat = () => {
        const CITIES = [{ lat: 40.7128, lng: -74.0060, ip: "192.168.1.10" }, { lat: 51.5074, lng: -0.1278, ip: "172.16.0.5" }, { lat: 35.6762, lng: 139.6503, ip: "10.0.0.1" }];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const lat = city.lat + (Math.random() - 0.5) * 5;
        const lng = city.lng + (Math.random() - 0.5) * 5;
        const id = Math.random().toString(36).substr(2, 9);
        const risk = Math.floor(Math.random() * 100);
        setThreats(prev => [...prev, { id, lat, lng, risk, ip: city.ip }]);
    };

    const STYLES = {
        container: { width: '100%', position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden' },
        controls: { position: 'absolute', bottom: '20px', left: '20px', zIndex: 10 },
        settingsIcon: { position: 'absolute', top: '20px', right: '20px', zIndex: 20, background: '#8b5cf6', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
        dropdown: { position: 'absolute', top: '60px', right: '20px', zIndex: 20, width: '200px', background: '#222', border: '1px solid #444', borderRadius: '12px', padding: '12px', color: '#fff', display: isSettingsOpen ? 'block' : 'none' },
        menuItem: { marginBottom: '10px' },
        label: { fontSize: '10px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '5px', display: 'block' },
        toggleGroup: { display: 'flex', gap: '5px' },
        toggleBtn: (active) => ({ flex: 1, padding: '5px', borderRadius: '4px', fontSize: '10px', border: 'none', cursor: 'pointer', background: active ? '#8b5cf6' : '#333', color: '#fff' }),
        slider: { width: '100%' },
        button: { background: '#8b5cf6', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' },
        marker: { width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px currentColor' }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.settingsIcon} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                {/* Fixed SVG Path: Standard Gear Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            </div>

            <div style={STYLES.dropdown}>
                <div style={STYLES.menuItem}>
                    <label style={STYLES.label}>{t.language}</label>
                    <div style={STYLES.toggleGroup}>
                        <button style={STYLES.toggleBtn(lang === 'EN')} onClick={() => setLang('EN')}>EN</button>
                        <button style={STYLES.toggleBtn(lang === 'AR')} onClick={() => setLang('AR')}>عربي</button>
                    </div>
                </div>
                <div style={STYLES.menuItem}>
                    <label style={STYLES.label}>{t.darkness}</label>
                    <input type="range" min="0" max="1" step="0.1" style={STYLES.slider} value={mapOpacity} onChange={(e) => setMapOpacity(parseFloat(e.target.value))} />
                </div>
            </div>

            <Map
                style={{
                    version: 8,
                    sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
                    layers: [
                        { id: 'background', type: 'background', paint: { 'background-color': '#000' } },
                        { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': mapOpacity } }
                    ]
                }}
                onMapLoad={setMapInstance}
            >
                {threats.map(threat => (
                    <MapMarker key={threat.id} map={mapInstance} longitude={threat.lng} latitude={threat.lat}>
                        <div style={{ ...STYLES.marker, backgroundColor: getRiskColor(threat.risk), color: getRiskColor(threat.risk) }} />
                    </MapMarker>
                ))}
            </Map>

            <div style={STYLES.controls}>
                <button style={STYLES.button} onClick={addRandomThreat}>{t.simulate}</button>
            </div>
        </div>
    );
}

return { View };
```

^ViewComponent

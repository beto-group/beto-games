

# ViewComponent

```jsx
// --- Script Loading Utility ---
async function loadScript(dc, url) {
  const scriptId = `script-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  // Check if already loaded
  if (document.getElementById(scriptId)) {
    console.log(`[LoadScript] Script already loaded: ${url}`);
    return;
  }
  
  console.log(`[LoadScript] Loading script: ${url}`);
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = url;
    script.onload = () => {
      console.log(`[LoadScript] ✅ Script loaded: ${url}`);
      resolve();
    };
    script.onerror = () => {
      console.error(`[LoadScript] ❌ Failed to load: ${url}`);
      reject(new Error(`Failed to load script: ${url}`));
    };
    document.head.appendChild(script);
  });
}

// --- Projection Interpolation ---
function interpolateProjection(d3, raw0, raw1) {
  const mutate = d3.geoProjectionMutator((t) => (x, y) => {
    const [x0, y0] = raw0(x, y);
    const [x1, y1] = raw1(x, y);
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
  });
  let t = 0;
  return Object.assign(mutate(t), {
    alpha(_) {
      return arguments.length ? mutate((t = +_)) : t;
    },
  });
}

function View(props) {
  const svgRef = dc.useRef(null);
  const [ready, setReady] = dc.useState(false);
  const [worldData, setWorldData] = dc.useState([]);
  const [threats, setThreats] = dc.useState([]);
  
  // Refs for D3 objects to avoid re-renders
  const projectionRef = dc.useRef(null);
  const pathRef = dc.useRef(null);
  const gRef = dc.useRef(null);
  const width = 800;
  const height = 600;

  // Helper to get color based on risk (0-100)
  // 0 (Safe) -> Light Pink (#fbcfe8)
  // 100 (Danger) -> Dark Purple (#4c1d95)
  const getRiskColor = (risk) => {
      if (!window.d3) return "#8b5cf6";
      return window.d3.interpolateRgb("#fbcfe8", "#4c1d95")(risk / 100);
  };

  // Helper to geolocate IP
  const geolocateIp = async (ip) => {
      try {
          const res = await fetch(`https://ipapi.co/${ip}/json/`);
          if (!res.ok) throw new Error('Geo API failed');
          const data = await res.json();
          if (data.latitude && data.longitude) {
              return { lat: data.latitude, lng: data.longitude, country: data.country_name };
          }
      } catch (e) {
          console.warn("Geolocation failed for IP:", ip, e);
      }
      return null;
  };

  // Mock function to add random threats
  const addRandomThreat = async () => {
      // List of major cities to ensure dots land on countries
      const CITIES = [
        { lat: 40.7128, lng: -74.0060, ip: "192.168.1.10" }, // New York
        { lat: 51.5074, lng: -0.1278, ip: "172.16.0.5" },    // London
        { lat: 35.6762, lng: 139.6503, ip: "10.0.0.1" },     // Tokyo
        { lat: -33.8688, lng: 151.2093, ip: "192.168.0.1" }, // Sydney
        { lat: -23.5505, lng: -46.6333, ip: "200.100.50.25" }, // Sao Paulo
        { lat: 55.7558, lng: 37.6173, ip: "85.10.20.30" },   // Moscow
        { lat: 30.0444, lng: 31.2357, ip: "196.20.30.40" },  // Cairo
        { lat: 19.0760, lng: 72.8777, ip: "103.50.60.70" },  // Mumbai
        { lat: 39.9042, lng: 116.4074, ip: "202.10.20.30" }, // Beijing
        { lat: 34.0522, lng: -118.2437, ip: "198.51.100.1" }, // Los Angeles
        { lat: 48.8566, lng: 2.3522, ip: "90.80.70.60" },    // Paris
        { lat: 52.5200, lng: 13.4050, ip: "80.70.60.50" },   // Berlin
        { lat: 1.3521, lng: 103.8198, ip: "118.200.10.1" },  // Singapore
        { lat: 25.2048, lng: 55.2708, ip: "94.10.20.30" },   // Dubai
        { lat: 43.6532, lng: -79.3832, ip: "142.10.20.30" }, // Toronto
        { lat: 37.7749, lng: -122.4194, ip: "192.168.1.50" }, // San Francisco
        { lat: 19.4326, lng: -99.1332, ip: "189.10.20.30" }, // Mexico City
        { lat: -34.6037, lng: -58.3816, ip: "181.10.20.30" }, // Buenos Aires
        { lat: 6.5244, lng: 3.3792, ip: "197.10.20.30" },    // Lagos
        { lat: -26.2041, lng: 28.0473, ip: "105.10.20.30" }  // Johannesburg
      ];

      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      
      // Add slight jitter so they don't stack perfectly if we add the same city twice
      // unless we want them to stack for the cluster demo.
      // Let's add very small jitter (0.5 deg) to simulate different IPs in same city
      const jitter = () => (Math.random() - 0.5) * 1.0;

      const lat = city.lat + jitter();
      const lng = city.lng + jitter();
      const id = Math.random().toString(36).substr(2, 9);
      const risk = Math.floor(Math.random() * 100);
      
      setThreats(prev => [...prev, { id, lat, lng, risk, ip: city.ip }]);
  };

  // Expose addThreat to window for testing/external use
  dc.useEffect(() => {
      window.addMapThreat = async (input, risk = 50) => {
          let lat, lng, ip;
          
          if (typeof input === 'string') {
              // Assume IP
              ip = input;
              const location = await geolocateIp(ip);
              if (location) {
                  lat = location.lat;
                  lng = location.lng;
              } else {
                  console.warn("Could not locate IP:", ip);
                  return;
              }
          } else if (typeof input === 'object' && input.lat && input.lng) {
              lat = input.lat;
              lng = input.lng;
              ip = input.ip || "Unknown";
          } else {
              return;
          }

          const id = Math.random().toString(36).substr(2, 9);
          setThreats(prev => [...prev, { id, lat, lng, risk, ip }]);
      };
      return () => delete window.addMapThreat;
  }, []);

  const STYLES = {
    container: {
      position: "relative",
      width: "100%",
      height: "100%",
      minHeight: "600px",
      backgroundColor: "#000000", // Black on black
      borderRadius: "12px",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    svg: {
      width: "100%",
      height: "100%",
      // border: "1px solid rgba(147, 51, 234, 0.3)",
      borderRadius: "8px",
      backgroundColor: "transparent",
      cursor: "grab",
    },
    controls: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 100
    },
    button: {
        background: 'rgba(139, 92, 246, 0.2)',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'monospace'
    },
    loadingOverlay: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      textAlign: "center",
      color: "#333",
      fontSize: "14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    },
    spinner: {
      width: "40px",
      height: "40px",
      border: "2px solid #111",
      borderTop: "2px solid #8b5cf6", // Subtle purple
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    keyframes: `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0% { r: 2; opacity: 1; stroke-width: 0; }
        100% { r: 8; opacity: 0; stroke-width: 0; }
      }
    `,
  };

  // Load D3 and TopoJSON libraries
  dc.useEffect(() => {
    async function loadLibraries() {
      if (!window.d3) {
        await loadScript(dc, "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js");
      }
      if (!window.topojson) {
        await loadScript(dc, "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js");
      }
      setReady(true);
    }
    loadLibraries();
  }, []);

  // Load world data
  dc.useEffect(() => {
    if (!ready) return;
    async function loadWorldData() {
      try {
        const response = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
        const world = await response.json();
        const countries = window.topojson.feature(world, world.objects.countries).features;
        setWorldData(countries);
      } catch (error) {
        console.error("Error loading world data:", error);
      }
    }
    loadWorldData();
  }, [ready]);

  // Initialize D3 Visualization
  dc.useEffect(() => {
    if (!ready || !worldData.length || !svgRef.current || !window.d3) return;

    const d3 = window.d3;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Setup Groups
    const g = svg.append("g");
    gRef.current = g;

    // Initial Projection Setup
    const initialScale = 250;
    const projection = interpolateProjection(
      d3,
      d3.geoOrthographicRaw,
      d3.geoEquirectangularRaw
    )
      .scale(initialScale)
      .translate([width / 2, height / 2])
      .rotate([0, 0])
      .precision(0.1);
    
    projection.alpha(0); // Start as Globe
    projectionRef.current = projection;

    const path = d3.geoPath(projection);
    pathRef.current = path;

    // Draw Countries
    const countries = g.selectAll("path")
      .data(worldData)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#000000") // Black fill
      .attr("stroke", "#ffffff") // White stroke
      .attr("stroke-width", 0.6)
      .attr("stroke-opacity", 0.8);

    // Draw Sphere Outline (Background for Globe)
    const sphere = g.append("path")
      .datum({ type: "Sphere" })
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#333") // Dark grey outline
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.5);

    // Threat Group
    const threatGroup = g.append("g").attr("class", "threats");

    // --- Interaction Logic ---
    
    // Interaction Logic
    let currentRotation = [0, 0];
    let currentScale = initialScale;
    let currentAlpha = 0;

    function update() {
      // Use external props if available, otherwise internal state
      const rot = props.externalRotation || currentRotation;
      const scl = props.externalScale || currentScale;
      
      // Calculate alpha based on scale if not provided externally? 
      // Or just map scale to alpha directly for the transition effect.
      // 250 = Globe, 800 = Map
      // t = (scl - 250) / (800 - 250)
      let t = 0;
      if (scl > 250) {
          t = Math.min(1, Math.max(0, (scl - 250) / 550));
      }
      // Allow overriding alpha explicitly if we want unrelated scale/projection
      const alpha = props.externalAlpha !== undefined ? props.externalAlpha : (t > 0 ? t : currentAlpha);

      // Update Projection
      projection
        .alpha(alpha)
        .scale(scl)
        .rotate(rot);
      
      // Clip Angle Logic (same as before)
      if (alpha < 0.1) {
          projection.clipAngle(90);
      } else {
          projection.clipAngle(null);
      }
      countries.attr("d", path);
      sphere.attr("d", path);
      
      // Reset clip for dots
      projection.clipAngle(null);

      // Update Threats
      const center = [-rot[0], -rot[1]];
      const d3 = window.d3;

      threatGroup.selectAll(".threat-group")
          .attr("transform", d => {
              const coords = projection([d.lng, d.lat]);
              if (!coords) return "translate(-9999,-9999)";
              return `translate(${coords[0]},${coords[1]})`;
          })
          .style("opacity", d => {
              if (alpha > 0.5) return 1; // Map mode
              
              // Check if on back side
              const dist = d3.geoDistance([d.lng, d.lat], center);
              if (dist > Math.PI / 2) {
                  return 0.3; // Dimmed for back side
              }
              return 1;
          })
          .style("display", "block");

      // Update Styles based on mode
      if (alpha > 0.5) {
          // Map Mode Styles
          countries.attr("stroke-opacity", 0.5);
          sphere.attr("stroke-opacity", 0); 
      } else {
          // Globe Mode Styles
          countries.attr("stroke-opacity", 0.8);
          sphere.attr("stroke-opacity", 0.5);
      }
    }

    // Drag Behavior (Rotation) - Only if NOT externally controlled
    const drag = d3.drag()
      .on("drag", (event) => {
        if (props.externalRotation) return; // Disable manual interaction if automated
        const rotate = projection.rotate();
        const k = 75 / projection.scale();
        currentRotation = [
          rotate[0] + event.dx * k,
          Math.max(-90, Math.min(90, rotate[1] - event.dy * k))
        ];
        update();
      });

    // Zoom Behavior (Transition) - Only if NOT externally controlled
    const zoom = d3.zoom()
      .scaleExtent([1, 10]) 
      .on("zoom", (event) => {
        if (props.externalScale) return; // Disable manual interaction if automated
        const k = event.transform.k;
        let t = Math.max(0, Math.min(1, k - 1));
        currentAlpha = t;
        
        if (k <= 2) {
            currentScale = initialScale * (1 + (t * 0.2)); 
        } else {
            currentScale = initialScale * 1.2 * (k - 1); 
        }

        update();
      });

    svg.call(drag).call(zoom);

    // Initial update
    update();

    // Export updateFn
    svgRef.current.updateFn = update;

    // React to external prop changes
    if (props.externalRotation || props.externalScale) {
        update();
    }

  }, [ready, worldData, props.externalRotation, props.externalScale]);

  // Helper to cluster threats
  const getClusteredThreats = (threatsData) => {
      const clusters = [];
      const threshold = 5; // degrees distance to cluster

      threatsData.forEach(threat => {
          let found = false;
          for (let cluster of clusters) {
              const dist = Math.sqrt(Math.pow(threat.lat - cluster.lat, 2) + Math.pow(threat.lng - cluster.lng, 2));
              if (dist < threshold) {
                  cluster.count++;
                  cluster.threats.push(threat);
                  // Update risk to be the max of the cluster
                  cluster.risk = Math.max(cluster.risk, threat.risk || 0);
                  found = true;
                  break;
              }
          }
          if (!found) {
              clusters.push({
                  id: 'cluster-' + threat.id,
                  lat: threat.lat,
                  lng: threat.lng,
                  count: 1,
                  threats: [threat],
                  risk: threat.risk || 0,
                  ip: threat.ip
              });
          }
      });
      return clusters;
  };

  // Effect to handle threats updates
  dc.useEffect(() => {
      if (!svgRef.current || !gRef.current || !projectionRef.current || !window.d3) return;
      
      const g = gRef.current;
      const threatGroup = g.select(".threats");
      const d3 = window.d3;
      
      const clusters = getClusteredThreats(threats);

      // Bind data
      const dots = threatGroup.selectAll(".threat-group")
          .data(clusters, d => d.id);
          
      // Enter
      const enter = dots.enter()
          .append("g")
          .attr("class", "threat-group")
          .style("cursor", "pointer");
      
      // Circle
      enter.append("circle")
          .attr("class", "threat-circle")
          .attr("r", d => d.count > 1 ? 6 : 3)
          .attr("fill", d => getRiskColor(d.risk))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

      // Count Label (if > 1)
      enter.append("text")
          .attr("class", "threat-count")
          .attr("text-anchor", "middle")
          .attr("dy", ".3em")
          .style("font-size", "8px")
          .style("fill", "#fff")
          .style("font-family", "monospace")
          .style("pointer-events", "none")
          .text(d => d.count > 1 ? d.count : "");

      // Pulse animation
      enter.append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0.5;1;0.5")
          .attr("dur", "2s")
          .attr("repeatCount", "indefinite");
          
      enter.append("title")
          .text(d => d.count > 1 
              ? `Cluster: ${d.count} Threats\nMax Risk: ${d.risk}%\nLocation: ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}`
              : `Threat Detected\nIP: ${d.ip}\nRisk: ${d.risk}%\nLat: ${d.lat.toFixed(2)}\nLng: ${d.lng.toFixed(2)}`
          );

      // Update existing
      dots.select(".threat-circle")
          .attr("r", d => d.count > 1 ? 8 : 4)
          .attr("fill", d => getRiskColor(d.risk));
          
      dots.select(".threat-count")
          .text(d => d.count > 1 ? d.count : "");

      // Exit
      dots.exit().remove();
      
      // Trigger update to position new dots
      if (svgRef.current.updateFn) {
          svgRef.current.updateFn();
      }
      
  }, [threats]);

  if (!ready) {
    return (
      <div style={STYLES.container}>
        <style>{STYLES.keyframes}</style>
        <div style={STYLES.loadingOverlay}>
          <div style={STYLES.spinner}></div>
          <span>Initializing...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={STYLES.container}>
      <style>{STYLES.keyframes}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={STYLES.svg}
        preserveAspectRatio="xMidYMid meet"
      />
      <div style={STYLES.controls}>
          <button style={STYLES.button} onClick={addRandomThreat}>
              + Simulate Threat
          </button>
      </div>
    </div>
  );
}

return { View };
````

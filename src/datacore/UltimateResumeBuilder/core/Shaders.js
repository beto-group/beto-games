// ─────────────────────────────────────────────────────────────
// 🧬 SHADER_ENGINE: GLSL CORE TOKENS
// ─────────────────────────────────────────────────────────────

export const PARTICLE_VERTEX = `
    varying vec2 vUv;
    varying float vOpacity;
    uniform float uTime;
    attribute float aSize;
    attribute float aSpeed;
    attribute float aOffset;

    void main() {
        vUv = uv;
        vec3 pos = position;
        
        // 🛰️ ORBITAL DRIFT
        float angle = uTime * aSpeed + aOffset;
        pos.x += cos(angle) * 20.0;
        pos.y += sin(angle) * 20.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        vOpacity = 0.1 + sin(uTime * aSpeed + aOffset) * 0.1;
    }
`;

export const PARTICLE_FRAGMENT = `
    varying float vOpacity;
    uniform vec3 uColor;

    void main() {
        // High-Fidelity Circular Mask
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        
        gl_FragColor = vec4(uColor, vOpacity * (1.0 - d * 2.0));
    }
`;

export const PULSE_FRAGMENT = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
        float d = distance(vUv, vec2(0.5));
        float pulse = sin(uTime * 8.0 - d * 20.0) * 0.5 + 0.5;
        pulse *= (1.0 - d * 2.0);
        
        if (pulse < 0.1) discard;
        gl_FragColor = vec4(uColor, pulse * 0.3);
    }
`;

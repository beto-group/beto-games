// ─────────────────────────────────────────────────────────────
// 🚀 UTILITY: GITHUB RELEASE / CDN SCRIPT LOADER
// ─────────────────────────────────────────────────────────────

async function loadScript(dc, src, options = {}) {
    const { globalName = null } = options;
    if (globalName && window[globalName]) return Promise.resolve(window[globalName]);

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
            if (globalName) resolve(window[globalName]);
            else resolve(script);
        };
        script.onerror = (e) => {
            console.error(`[URB_LoadScript] Error loading ${src}:`, e);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
    });
}

const _exports = { loadScript };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

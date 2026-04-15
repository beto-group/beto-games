/**
 * 🛰️ PLATFORM ADAPTER: UNIVERSAL MULTI-ENVIRONMENT BRIDGE
 * ─────────────────────────────────────────────────────────────
 * This is the 'One Source' intelligence layer. It detects its 
 * environment and abstracts React hooks/APIs into a unified 
 * interface that works in DataCore, Native Obsidian, and Next.js.
 */

// ⚛️ REACT RESOLUTION: High-Fidelity Hook Bridge
const R = (typeof dc !== 'undefined') ? dc : (typeof window !== 'undefined' && window.React) || require('react');

const Platform = {
    // 🧬 ENVIRONMENT DETECTION
    type: (typeof dc !== 'undefined') ? 'datacore' : (typeof window !== 'undefined' && window.app) ? 'native' : 'web',
    
    // ⚛️ UNIFIED REACT HOOKS (Framework Agnostic Bridge)
    useState: R.useState,
    useEffect: R.useEffect,
    useRef: R.useRef,
    useCallback: R.useCallback,
    useMemo: R.useMemo,
    useContext: R.useContext,

    // 📁 RESOURCE RESOLUTION (Local Vault vs Public Web Pathing)
    resolveResource: (path) => {
        if (typeof dc !== 'undefined') return path;
        if (typeof window !== 'undefined' && window.app && window.app.vault) {
            const file = window.app.vault.getAbstractFileByPath(path);
            return file ? window.app.vault.getResourcePath(file) : path;
        }
        return `/_resources/data/${path.split('/').pop()}`; // Web Fallback
    }
};

/**
 * 🛠️ ADAPTER FACTORY: Orchestration Bridge
 * Required for backward compatibility with App.jsx and native/main.tsx.
 */
const createAdapter = (dc, modules) => {
    return {
        Platform,
        // Extend with environment-specific overrides if necessary
        getVault: () => Platform.type === 'web' ? null : (dc?.app?.vault || window.app?.vault)
    };
};

const _exports = { Platform, createAdapter };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

// ─────────────────────────────────────────────────────────────
// 🖥️ CORE: UNIVERSAL PLATFORM ADAPTER (BETO Deployment Bridge)
// ─────────────────────────────────────────────────────────────
// This adapter abstracts the host environment (DataCore, Native, Web)
// so the UI Core can remain 100% platform-agnostic.

const createAdapter = (dc, modules) => {
    const isDataCore = !!dc;
    const isNative = !!window.app && !isDataCore;
    const isWeb = !window.app && !isDataCore;

    const TOKENS = modules?.TOKENS || {};

    // ─── 📦 RESOURCE LOADER ─────────────────────────────────────────
    const requireAsset = async (path) => {
        if (isDataCore) return await dc.require(path);
        if (isNative) {
             const fs = window.require('fs');
             const electron = window.require('electron');
             // Native Obsidian require logic
             return null; // Implementation pending dynamic bundling
        }
        return null; // Web version uses standard imports
    };

    // ─── 💾 DATA ACCESS ─────────────────────────────────────────────
    const getVaultData = async (filePath) => {
        if (isDataCore) return await dc.app.vault.adapter.read(filePath);
        if (isNative) return await window.app.vault.adapter.read(filePath);
        if (isWeb) {
            const res = await fetch(`/api/vault?path=${encodeURIComponent(filePath)}`);
            return await res.json();
        }
    };

    // ─── 🚀 DEPLOYMENT GUTS ─────────────────────────────────────────
    const deploy = async (target, payload) => {
        console.log(`[Adapter] [DEPLOY] Target: ${target}`);
        // Logic handled by DeployBridge component using these hooks
    };

    return {
        isDataCore,
        isNative,
        isWeb,
        TOKENS,
        requireAsset,
        getVaultData,
        deploy
    };
};

const _exports = { createAdapter };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

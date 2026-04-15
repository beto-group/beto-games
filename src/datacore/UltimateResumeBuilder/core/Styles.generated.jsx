"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


// ─────────────────────────────────────────────────────────────
// 🎨 ELITE DESIGN SYSTEM (Core Styles - Polished & Aligned)
// ─────────────────────────────────────────────────────────────

const TOKENS = {
    bg: 'rgba(5, 5, 5, 1)',
    glassBg: 'rgba(10, 10, 15, 0.25)',
    accent: 'hsl(265, 89%, 66%)', 
    accentCyan: 'hsl(190, 90%, 50%)',
    accentAmber: 'hsl(45, 100%, 50%)',
    text: '#ffffff',
    textDim: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    radius: '16px',
    font: '"Outfit", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    // 🛡️ Z-LAYER REGISTRY (High-Security Hierarchy)
    Z: {
        BASE: 0,
        PARTICLES: 10,
        VIEWPORT: 100,
        CINEMATIC: 200,
        MODAL_BACKDROP: 20000,
        MODAL_CONTENT: 20002,
        HUD_SENSOR: 59999,
        HUD_STACK: 60000,
        TOOLTIP: 70000
    }
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

.urb-root {
    --accent: ${TOKENS.accent};
    position: relative;
    width: 100%; height: 100%;
    background: ${TOKENS.bg};
    color: ${TOKENS.text};
    font-family: ${TOKENS.font};
    overflow: hidden;
    display: flex; flex-direction: column;
}

/* 🧪 INTEGRATED HUD DRAWER (Expanding Command Plate) */
.urb-hud {
    position: absolute; top: 0; left: 0; width: 100%;
    padding: 10px 20px; z-index: 10000;
    display: flex; flex-direction: column;
    background: rgba(8, 8, 12, 0.4);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid ${TOKENS.border};
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: all;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6);

    overflow: visible;
}
.urb-hud.hidden { transform: translateY(-100%); opacity: 0; pointer-events: none; }

.urb-hud-drawer {
    transform: translateY(-10px); opacity: 0; pointer-events: none;
    z-index: 9999;
}
.urb-hud-drawer.visible { transform: translateY(0); opacity: 1; pointer-events: auto; }

.urb-settings-panel {
    position: absolute;
    top: 115px; 
    right: 40px;
    width: 420px;
    padding: 30px;
    background: rgba(12, 12, 18, 0.9);
    backdrop-filter: blur(40px);
    border: 1px solid ${TOKENS.border};
    border-radius: 12px;
    box-shadow: 0 50px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 20px;
    z-index: 21000;
    pointer-events: auto;
}

.urb-settings-wrapper {
    position: absolute;
    inset: 0;
    z-index: 20999;
    pointer-events: none;
    overflow: hidden;
}



.urb-hud-main {
    width: 100%; height: 48px;
    display: flex; justify-content: space-between; align-items: center;
}

.urb-hud-drawer {
    width: 100%; padding: 20px 0;
    border-top: 1px solid ${TOKENS.border};
    margin-top: 5px;
    display: flex; flex-direction: column; gap: 20px;
}

.urb-briefing-box {
    background: rgba(255,255,255,0.02);
    padding: 15px; border-radius: 4px; border-left: 2px solid ${TOKENS.accent};
}
.urb-briefing-text {
    font-size: 10px; line-height: 1.6; color: ${TOKENS.textDim};
    letter-spacing: 0.5px; margin-top: 10px;
}

.urb-logo-wrap {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
}
.urb-logo-text {
    font-family: ${TOKENS.fontMono}; font-size: 18px; font-weight: 900;
    color: white; letter-spacing: 2px;
}
.urb-logo-text span {
    font-size: 9px; opacity: 0.5; font-weight: 300; letter-spacing: 4px;
    margin-left: 8px;
}
.urb-hud-badge {
    font-family: ${TOKENS.fontMono}; font-size: 7px; color: ${TOKENS.accent};
    background: rgba(168, 85, 247, 0.08); padding: 1px 6px; border-radius: 2px;
    letter-spacing: 2px; border: 1px solid rgba(168, 85, 247, 0.2);
}
.urb-hud-tabs {
    display: none;
}
.urb-nav-acts {
    display: flex; gap: 12px; align-items: center;
}
.urb-act-btn {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.6);
    font-family: ${TOKENS.fontMono}; font-size: 9px; font-weight: 900;
    padding: 6px 12px; border-radius: 4px; cursor: pointer;
    transition: all 0.2s ease; letter-spacing: 1.5px;
}
.urb-act-btn:hover { background: rgba(255,255,255,0.08); color: white; border-color: rgba(255,255,255,0.2); }
.urb-act-btn.active { background: ${TOKENS.accent}; color: white; border-color: transparent; }
.urb-act-btn.primary { background: white; color: black; border-color: white; }

.urb-sector-dropdown {
    position: absolute; top: 70px; right: 20px;
    width: 240px; 
    background: rgba(5, 5, 8, 0.85);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px; padding: 20px;
    display: flex; flex-direction: column; gap: 4px;
    box-shadow: 0 50px 100px rgba(0,0,0,0.9);
    z-index: 1000; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateX(40px); opacity: 0; pointer-events: none;
}
.urb-sector-dropdown.visible { transform: translateX(0); opacity: 1; pointer-events: auto; }
.urb-sector-item {
    padding: 12px 16px; font-family: ${TOKENS.fontMono}; font-size: 10px;
    color: rgba(255,255,255,0.4); text-align: right; letter-spacing: 2px;
    cursor: pointer; transition: all 0.2s ease; border-radius: 4px;
}
.urb-sector-item:hover { color: white; background: rgba(255,255,255,0.05); }
.urb-sector-item.active { color: ${TOKENS.accent}; font-weight: 900; background: rgba(168, 85, 247, 0.05); }

.urb-nav-acts { display: flex; gap: 10px; align-items: center; }

.urb-act-btn {
    padding: 6px 14px; border-radius: 4px; border: 1px solid ${TOKENS.border};
    background: rgba(255,255,255,0.02); color: ${TOKENS.textDim};
    font-size: 9px; font-weight: 900; letter-spacing: 1.5px;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.urb-act-btn:hover { color: white; background: rgba(255,255,255,0.08); border-color: ${TOKENS.accent}; }
.urb-act-btn.active { background: ${TOKENS.accent}; color: white; border-color: transparent; }

/* 🔍 PREVIEW SCALING ENGINE */
.urb-preview-container {
    width: 100%; height: 100%; position: relative;
    overflow-y: auto; overflow-x: hidden;
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.urb-preview-container::-webkit-scrollbar { width: 6px; }
.urb-preview-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.urb-preview-content {
    width: 100%; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top center;
}
.urb-preview-content.scaled { transform: scale(0.4); }
.urb-preview-content.zoomed { transform: scale(1); }

.urb-metadata {
    font-family: ${TOKENS.fontMono}; font-size: 8px;
    color: ${TOKENS.textMuted}; line-height: 1.5;
    text-align: right; letter-spacing: 0.5px;
}

.status-bar { display: none !important; }

/* 🧪 HOVER SENSOR */
.urb-hover-sensor {
    position: absolute; top: 0; left: 0; width: 100%; height: 20px;
    z-index: 10000; cursor: ns-resize;
}

/* 🧪 ELITE SCROLLBARS */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: ${TOKENS.accent}; }

.urb-viewport { flex: 1; position: relative; cursor: row-resize; }

/* 🎭 DUAL-PANEL ORCHESTRATION */
.urb-dual-layout {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    gap: 40px;
    padding: 60px;
    box-sizing: border-box;
}

@keyframes urb-drift-left {
    from { opacity: 0; transform: translateX(-60px) scale(0.95); }
    to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes urb-drift-right {
    from { opacity: 0; transform: translateX(60px) scale(0.95); }
    to { opacity: 1; transform: translateX(0) scale(1); }
}

.urb-media-pane {
    flex: 1.2;
    height: 75%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: urb-drift-left 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.urb-video-frame {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 30px 60px rgba(0,0,0,0.8);
    background: #000;
}

.urb-video-frame video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.urb-intel-pane {
    flex: 0.8;
    padding: 50px;
    background: rgba(10, 10, 15, 0.4);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.9);
    animation: urb-drift-right 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}

.urb-intel-header { 
    font-size: 10px; 
    color: var(--urb-print-accent, #a855f7); 
    font-weight: 900; 
    letter-spacing: 4px; 
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.urb-intel-title {
    font-size: 42px;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 25px;
    color: white;
    letter-spacing: -2px;
}

.urb-intel-body {
    font-size: 18px;
    line-height: 1.6;
    color: rgba(255,255,255,0.8);
    font-weight: 300;
}

.urb-mission-loop {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 30px;
}

.urb-mission-item {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    font-weight: 600;
}

@keyframes urb-fade-in {
    from { 
        opacity: 0; 
        transform: translateY(10px) scale(0.99);
    }
    to { 
        opacity: 1; 
        transform: translateY(0) scale(1);
    }
}
.fade-in { animation: urb-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes urb-float {
    0% { transform: translateY(calc(0px)); }
    50% { transform: translateY(calc(-10px)); }
    100% { transform: translateY(calc(0px)); }
}
.urb-float { animation: urb-float 6s ease-in-out infinite; }

.cinematic-stage { 
    perspective: 1200px; 
    transform-style: preserve-3d;
}

@keyframes urb-breathing {
    0% { transform: rotateX(0deg) rotateY(0deg) scale(1.0); }
    25% { transform: rotateX(2deg) rotateY(-1deg) scale(1.01); }
    50% { transform: rotateX(0deg) rotateY(-3deg) scale(1.02); }
    75% { transform: rotateX(-2deg) rotateY(-1deg) scale(1.01); }
    100% { transform: rotateX(0deg) rotateY(0deg) scale(1.0); }
}
.urb-breathing { 
    animation: urb-breathing 8s ease-in-out infinite; 
    transform-style: preserve-3d;
}
@keyframes urb-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}
.urb-pulse { animation: urb-pulse 2s infinite; }

.urb-mini-terminal {
    font-family: ${TOKENS.fontMono};
    font-size: 9px;
    background: rgba(0,0,0,0.4);
    border: 1px solid ${TOKENS.border};
    border-radius: 4px;
    padding: 10px;
    overflow-y: auto;
    color: ${TOKENS.textDim};
    line-height: 1.5;
}

.urb-mini-terminal::-webkit-scrollbar { width: 3px; }
.urb-mini-terminal::-webkit-scrollbar-thumb { background: ${TOKENS.accent}44; }

/* 🛰️ HUD REFINEMENT: COMMAND STRIP */
.urb-hud-strip {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap !important;
    align-items: center;
    gap: 4px;
    background: rgba(15, 15, 20, 0.45);
    backdrop-filter: blur(25px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 5px 8px;
    border-radius: 40px;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 30px rgba(0,0,0,0.6);
    min-width: max-content;
}

.urb-hud-strip:hover {
    background: rgba(20, 20, 25, 0.75);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 15px 45px rgba(0,0,0,1);
}

.urb-icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    border: 1px solid transparent;
    color: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    flex-shrink: 0;
}

.urb-icon-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
    transform: translateY(-2px);
}

.urb-icon-btn.active {
    color: var(--accent);
    background: rgba(168, 85, 247, 0.15);
    border-color: rgba(168, 85, 247, 0.25);
}

.urb-icon-btn.primary { color: #10b981; }
.urb-icon-btn.web { color: #3b82f6; }
.urb-icon-btn.danger { color: #ef4444; }

/* 🛰️ TOOLTIP ENGINE: Forensic Labeling (JS MANAGED) */
.urb-tooltip-js {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(5, 5, 8, 0.95);
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 8px;
    font-family: var(--font-mono);
    color: var(--accent);
    white-space: nowrap;
    border: 1px solid rgba(168, 85, 247, 0.3);
    box-shadow: 0 10px 20px rgba(0,0,0,0.8);
    z-index: ${TOKENS.Z.TOOLTIP};
    letter-spacing: 1px;
    pointer-events: none;
}

/* 🛰️ SETTINGS ENGINE: Tactical Configuration (Expanded) */
.urb-settings-expanded-wrapper {
    width: 100%;
    max-height: 0;
    overflow: hidden;
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0;
}
.urb-settings-expanded-wrapper.visible {
    max-height: 1200px;
    opacity: 1;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.05);
}

.urb-settings-panel {
    width: 100%;
    background: rgba(10, 10, 15, 0.3);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.urb-settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.urb-setting-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.urb-setting-label {
    font-size: 8px;
    font-weight: 950;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
}

.urb-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    padding: 10px 12px;
    color: white;
    font-family: ${TOKENS.fontMono};
    font-size: 11px;
    outline: none;
    transition: all 0.3s ease;
}
.urb-input:focus {
    border-color: ${TOKENS.accent};
    background: rgba(168, 85, 247, 0.05);
}

.urb-section-divider {
    height: 1px;
    background: linear-gradient(to right, rgba(168, 85, 247, 0.3), transparent);
    margin: 10px 0;
}

@keyframes urb-pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.6); }
}

/* ☢️ NUCLEAR EXTRACTION: DOM HOISTING OVERRIDES */
@media print {
    @page { size: A4; margin: 0; }

    body.urb-is-printing > *:not(.urb-print-area) { 
        display: none !important; 
        visibility: hidden !important; 
    }
    
    body.urb-is-printing .urb-print-area {
        display: block !important;
        visibility: visible !important;
        position: absolute !important;
        top: 0 !important; left: 0 !important;
        width: 100% !important;
        height: 100vh !important;
        max-height: 297mm !important;
        overflow: hidden !important;
        break-inside: avoid !important;
        z-index: 9999999 !important;
        transform-origin: top left;
        transform: scale(0.96); /* Surgical scale to ensure 1-page fit */
    }

    /* 🎨 THEME: DARK_DOSSIER (Cinematic) */
    body.urb-theme-dark { 
        --urb-print-bg: #050508; 
        --urb-print-text: #ffffff; 
        --urb-print-accent: #a855f7;
        background-color: var(--urb-print-bg) !important; color: var(--urb-print-text) !important; 
    }
    body.urb-theme-dark .urb-print-area { background-color: var(--urb-print-bg) !important; }
    
    /* 🎨 THEME: LIGHT_MANIFEST (Standard) */
    body.urb-theme-light { 
        --urb-print-bg: #ffffff; 
        --urb-print-text: #000000; 
        --urb-print-accent: #6b21a8;
        background-color: var(--urb-print-bg) !important; color: var(--urb-print-text) !important; 
    }
    body.urb-theme-light .urb-print-area { background-color: var(--urb-print-bg) !important; }
    body.urb-theme-light * { 
        color: var(--urb-print-text) !important; 
        border-color: rgba(0,0,0,0.1) !important; 
    }
}


`;

const _exports = { TOKENS, GLOBAL_CSS };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Web Mock for 'dc' global if needed
if (typeof window !== 'undefined') {
    window.dc = {
        // React hooks for components that extract them from dc
        useState,
        useEffect,
        useRef,
        useCallback,
        useMemo,
        React,
        app: {
            vault: {
                adapter: {
                    read: async (path) => {
                        const webPath = path.replace(/^.*NextWebsite\/src\//, '/content/src/')
                            .replace(/^\/?src\//, '/content/src/');

                        console.log(`🌐 [WebShim] adapter.read -> fetch(${webPath})`);
                        try {
                            const res = await fetch(webPath);
                            if (res.ok) return await res.text();
                        } catch (e) { }
                        return "## Content Load Error\nCould not fetch: " + webPath;
                    }
                }
            }
        },
        require: async (path) => {
            console.log(`🌐 [WebShim] require(${path})`);

            // 1. Normalize name
            const fileName = path.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');

            // 2. Handle RetroMorphGame internal dependencies via dynamic import
            if (path.includes('RetroMorphGame')) {
                try {
                    if (path.includes('HeroSection')) {
                        console.log(`🌐 [WebShim] Loading HeroSection via dynamic import`);
                        return await import('../datacore/games/RetroMorphGame/src/components/HeroSection.generated.jsx');
                    }
                    if (path.includes('useRetroEngine')) {
                        console.log(`🌐 [WebShim] Loading useRetroEngine via dynamic import`);
                        return await import('../datacore/games/RetroMorphGame/src/hooks/useRetroEngine.generated.jsx');
                    }
                    if (path.includes('styles.jsx') || path.includes('styles/styles')) {
                        console.log(`🌐 [WebShim] Loading STYLES via dynamic import`);
                        return await import('../datacore/games/RetroMorphGame/src/styles/styles.generated.jsx');
                    }
                    if (path.includes('domUtils')) {
                        console.log(`🌐 [WebShim] Loading domUtils via dynamic import`);
                        return await import('../datacore/games/RetroMorphGame/src/utils/domUtils.generated.jsx');
                    }
                } catch (e) {
                    console.error(`🌐 [WebShim] Dynamic import failed for ${path}:`, e);
                }
            }

            // 3. Try Registry lookup for top-level components
            try {
                const { Registry } = await import('../datacore/registry.generated');
                // Find the MOST SPECIFIC match (longest key) to handle nested paths correctly
                // e.g., 'RetroMorphGame/src/components/HeroSection' should match before 'RetroMorphGame'
                const matchingKeys = Object.keys(Registry)
                    .filter(key => path.includes(key))
                    .sort((a, b) => b.length - a.length); // Longest first

                const matchingKey = matchingKeys[0];

                if (matchingKey) {
                    console.log(`🌐 [WebShim] Resolved via Registry: ${matchingKey}`);
                    const mod = await Registry[matchingKey]();
                    return mod;
                }
            } catch (e) {
                console.warn(`🌐 [WebShim] Registry lookup failed for ${path}:`, e);
            }

            // 4. Fallback to basic mocks
            if (path.includes('styles.jsx')) return window.STYLES || {};
            if (path.includes('domUtils')) return {
                findNearestAncestorWithClass: (el, cls) => el?.closest(`.${cls}`),
                findDirectChildByClass: (el, cls) => el?.querySelector(`:scope > .${cls}`)
            };

            return {};
        },
        // Simple Icon Shim for Web
        Icon: ({ icon, className = "", style = {} }) => {
            const icons = {
                'zap': (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                ),
                'rotate-ccw': (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <polyline points="3 3 3 8 8 8" />
                    </svg>
                ),
                'help-circle': (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                )
            };

            const svgContent = icons[icon];

            return (
                <span
                    className={`dc-icon-web ${className}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1em',
                        height: '1em',
                        ...style
                    }}
                    title={icon}
                >
                    {svgContent || (
                        <span style={{
                            fontSize: '0.8em',
                            border: '1px solid currentColor',
                            borderRadius: '4px',
                            padding: '2px',
                            opacity: 0.7
                        }}>ⓘ</span>
                    )}
                </span>
            );
        },
        Icons: ({ icon, ...props }) => {
            // Alias Icons to Icon for plural compatibility
            const Icon = window.dc.Icon;
            return <Icon icon={icon} {...props} />;
        }
    };
    window.dcApi = window.dc;
}

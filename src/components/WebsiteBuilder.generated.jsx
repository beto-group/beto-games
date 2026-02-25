"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


const CONTENT_PATH = '/content'; // Public path where build-shim.js copies files

function WebsiteBuilder(props) {
    const {
        STYLES = {}, Navbar, HeroSection, isFullTab, onToggleFullTab,
        PrototypePage, MarkdownRenderer, DatacoreShim, folderPath,
        dc: dcApi, useRouting, VersionLogger,
        EvolutionEngine, LiveTicker, GameArcade, GameCard, GlobalLeaderboard, Arena, RetroMorphGame
    } = props;

    // We need to inject these new components via props in index.jsx really, 
    // but for now we might rely on them being available or passed.
    // Wait, PageRouter and Footer are NEW. They trigger ReferenceError if not passed.
    // I will assume they are passed in props or I need to require them here?
    // "Prop Injection" rule says pass from index.jsx. 
    // BUT for this task, I am modifying WebsiteBuilder. 
    // I should updated index.jsx first? No, I can default to props and if missing error out, 
    // but let's assume I will update index.jsx next.

    const { PageRouter, Footer } = props;

    // console.log("💎 [WebsiteBuilder] Orchestrator Mode");
    // Hooks provided by React import

    // Dynamic State
    const [navItems, setNavItems] = useState(['HOME']);
    const [routesConfig, setRoutesConfig] = useState({}); // Store route config from FM

    // Determine initial tab from Next.js params if available
    const slug = props.params?.slug || [];
    const isRootAdmin = slug.length > 0 && slug[0].toLowerCase() === 'admin';
    const initialTab = (slug.length > 0 && !isRootAdmin)
        ? slug.join('/').toUpperCase()
        : 'HOME';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [contentCache, setContentCache] = useState({});
    const [indexContent, setIndexContent] = useState(null); // The body of INDEX.md

    // 1. Fetch Orchestrator (INDEX.md)
    useEffect(() => {
        async function loadOrchestrator() {
            try {
                let text = "";

                if (typeof window !== 'undefined' && window.app && window.app.vault) {
                    const indexPath = folderPath + '/src/data/content/INDEX.md';
                    text = await window.app.vault.adapter.read(indexPath);
                } else {
                    const res = await fetch(`${CONTENT_PATH}/INDEX.md`);
                    text = await res.text();
                }

                if (text) processOrchestrator(text);

            } catch (e) {
                console.error("Failed to load INDEX.md", e);
            }
        }
        loadOrchestrator();
    }, []);

    // Helper: Parse Frontmatter & Expose to Debugger
    const parseFrontmatter = (text, context = 'PAGE') => {
        const frontmatterMatch = text.match(/^---\s*[\r\n]+([\s\S]+?)[\r\n]+---\s*/);
        let metadata = {};

        if (frontmatterMatch) {
            const fm = frontmatterMatch[1].trim();
            // Basic Key-Value Parser
            const lines = fm.split('\n');
            let currentKey = null;

            lines.forEach(line => {
                const parts = line.split(':');
                const key = parts[0].trim();

                const indentation = line.search(/\S|$/); // Find first non-space char index

                if (line.trim().startsWith('-')) {
                    // Array item (Navigation)
                    if (currentKey === 'navigation') {
                        if (!metadata.navigation) metadata.navigation = [];
                        // Remove dash, trim, and remove optional surrounding quotes
                        let rawVal = line.replace('-', '').trim().replace(/^["'](.*)["']$/, '$1');

                        // Handle [[Link]] or [[Link|Label]]
                        const wikiMatch = rawVal.match(/\[\[(.*?)\]\]/);
                        if (wikiMatch) {
                            const inner = wikiMatch[1];
                            const [link, label] = inner.split('|');
                            metadata.navigation.push({
                                value: link.trim(),
                                label: (label || link).trim().toUpperCase()
                            });
                        } else {
                            metadata.navigation.push({ value: rawVal, label: rawVal });
                        }
                    }
                } else if (parts.length >= 2) {
                    const value = parts.slice(1).join(':').trim();

                    if (key === 'routes') {
                        currentKey = 'routes';
                        metadata.routes = {};
                    } else if (key === 'navigation') {
                        currentKey = 'navigation';
                        metadata.navigation = [];
                    } else if (currentKey === 'routes' && indentation > 0) {
                        // This is a nested property of 'routes'
                        if (!metadata.routes) metadata.routes = {};

                        // Try to parse the value
                        let parsedVal = value;
                        if (value.startsWith('{')) {
                            try {
                                // Lax parsing for { type: 'component', name: 'Arena' }
                                parsedVal = new Function(`return ${value}`)();
                            } catch (e) {
                                console.warn("Error parsing route value", value);
                            }
                        }
                        metadata.routes[key] = parsedVal;
                    } else {
                        metadata[key] = value;
                        currentKey = key;
                    }
                }
            });

            // Re-implementing specific extraction for known fields to be safe
            const navBlockMatch = fm.match(/navigation\s*:([\s\S]*?)(?=\n\w+:|$)/);
            if (navBlockMatch) {
                // Reset and re-parse carefully
                metadata.navigation = [];
                const navBlock = navBlockMatch[1];

                // Split by top-level items (lines starting with '  - ')
                const itemBlocks = navBlock.split(/\n\s{2}-\s/).filter(Boolean);

                itemBlocks.forEach(block => {
                    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

                    // Check if this is a simple string item or multi-line object
                    if (lines.length === 1 && !lines[0].includes(':')) {
                        // Simple string: "HOME" or "GAMES"
                        const rawVal = lines[0].replace(/^[#\s]+/, '').trim();
                        if (!rawVal.startsWith('#')) { // Skip comments
                            metadata.navigation.push({ value: rawVal, label: rawVal });
                        }
                    } else {
                        // Multi-line object with properties
                        const item = {};
                        lines.forEach(line => {
                            // Skip comment lines
                            if (line.startsWith('#')) return;

                            const colonIdx = line.indexOf(':');
                            if (colonIdx > 0) {
                                const key = line.substring(0, colonIdx).trim();
                                let val = line.substring(colonIdx + 1).trim();

                                // Parse booleans
                                if (val === 'true') val = true;
                                else if (val === 'false') val = false;

                                item[key] = val;
                            }
                        });

                        // Only add if we have meaningful content
                        if (item.separator || item.label || item.value) {
                            metadata.navigation.push(item);
                        }
                    }
                });
            }
        }

        // Expose to Console (Debug)
        if (typeof window !== 'undefined') {
            if (!window.YAML) window.YAML = {};
            window.YAML[context] = metadata;
            window.getPageMetadata = () => { console.table(window.YAML); return window.YAML; };
        }

        return metadata;
    };

    // 2. Parse Orchestrator
    const processOrchestrator = (text) => {
        const metadata = parseFrontmatter(text, 'ORCHESTRATOR');

        let defaultRoute = metadata.defaultRoute || 'HOME';
        let links = metadata.navigation || [{ label: 'HOME', value: 'HOME' }];

        setNavItems(links);
        setRoutesConfig(metadata.routes || {});

        // C. Content Extraction (Remove FM)
        let cleanContent = text.replace(/^---\s*[\r\n]+[\s\S]+?[\r\n]+---\s*/, '').trim();
        setIndexContent(cleanContent);

        if (activeTab === 'HOME' && defaultRoute !== 'HOME') {
            // Logic for redirect could go here
        }
    };

    // 3. Routing Hook
    useRouting({ sidebarTab: activeTab, setSidebarTab: setActiveTab, isMounted: true, dcApi });

    // 3.5 PWA Manifest Swapper
    useEffect(() => {
        if (typeof document === 'undefined') return;

        let manifestUrl = '/manifest.json'; // Default
        if (activeTab.startsWith('PLAY/')) {
            const gameId = activeTab.split('/')[1]?.toLowerCase();
            if (gameId) {
                manifestUrl = `/api/manifest?game=${encodeURIComponent(gameId)}`;
            }
        }

        // Find or create the manifest link
        let link = document.querySelector('link[rel="manifest"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'manifest';
            document.head.appendChild(link);
        }

        if (link.getAttribute('href') !== manifestUrl) {
            console.log(`[PWA] Updating manifest context: ${manifestUrl}`);
            link.setAttribute('href', manifestUrl);
        }
    }, [activeTab]);

    // 4. Fetch Tab Content
    useEffect(() => {
        if (!activeTab || activeTab === 'INDEX') return;
        if (activeTab.startsWith('PLAY')) return; // Handled by PageRouter/Arena logic

        if (contentCache[activeTab]) return;

        async function loadTabContent() {
            try {
                // Default convention: Route NAME -> NAME.md
                // Unless we have a routes map (which is hard to parse without YAML lib)
                const filename = `${activeTab}.md`;
                let text = "";

                if (typeof window !== 'undefined' && window.app && window.app.vault) {
                    text = await window.app.vault.adapter.read(folderPath + `/src/data/content/${filename}`);
                } else {
                    const res = await fetch(`${CONTENT_PATH}/${filename}`);
                    if (!res.ok) throw new Error("404");
                    text = await res.text();
                }

                // Parse Metadata for this page (if any)
                parseFrontmatter(text, activeTab);

                // Clean Content
                const cleanContent = text.replace(/^---\s*[\r\n]+[\s\S]+?[\r\n]+---\s*/, '').trim();

                setContentCache(prev => ({ ...prev, [activeTab]: cleanContent }));
            } catch (e) {
                console.warn(`Could not load ${activeTab}.md`, e);
                setContentCache(prev => ({ ...prev, [activeTab]: "# Content Not Found" }));
            }
        }
        loadTabContent();
    }, [activeTab, contentCache]);

    // Bound Components for MarkdownRenderer
    const boundComponents = {
        DatacoreShim,
        PrototypePage,
        CallToAction: HeroSection, // Alias
        HeroSection,
        EvolutionEngine,
        LiveTicker,
        GameArcade,
        GameCard,
        GlobalLeaderboard,
        Arena,
        RetroMorphGame,
        // UI Components
        Navbar: (p) => (
            <Navbar
                {...p}
                currentPage={activeTab}
                setCurrentPage={setActiveTab}
                navItems={navItems}
                STYLES={STYLES}
                AnimatedLogo={props.AnimatedLogo}
                useIsMobile={props.useIsMobile}
            />
        ),
        Footer: (p) => <Footer {...p} STYLES={STYLES} />,
        PageRouter: (p) => (
            <PageRouter
                {...p}
                activeTab={activeTab}
                contentCache={contentCache}
                MarkdownRenderer={MarkdownRenderer}
                components={boundComponents} // Pass self for recursion
                folderPath={folderPath}
                STYLES={STYLES}
                setCurrentPage={setActiveTab}
            />
        )
    };

    const LoadingPage = ({ text = "Loading" }) => {
        const Logo = props.AnimatedLogo;
        const useIsMobile = props.useIsMobile;

        return (
            <div style={{
                height: '100dvh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#050505',
                color: '#fff',
                fontFamily: STYLES.fontFamily || 'Inter, system-ui, sans-serif'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'loadingFadeIn 1s ease-out forwards',
                }}>
                    {Logo ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '280px', // 56px * 5
                            height: '280px',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                transform: 'scale(5)',
                                transformOrigin: 'center center'
                            }}>
                                <Logo
                                    forceAnimate={true}
                                    speedMultiplier={2}
                                    useIsMobile={useIsMobile}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTop: '3px solid #4ade80',
                            borderRadius: '50%',
                            animation: 'loadingSpin 1s linear infinite'
                        }} />
                    )}
                    <div style={{
                        marginTop: '120px', // Space for the huge logo
                        fontSize: '11px',
                        letterSpacing: '0.4em',
                        textTransform: 'uppercase',
                        fontWeight: '500',
                        color: 'rgba(255,255,255,0.3)',
                    }}>
                        {text}
                    </div>
                </div>
                <style>{`
                    @keyframes loadingSpin { to { transform: rotate(360deg); } }
                    @keyframes loadingFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>
            </div>
        );
    };

    if (indexContent === null) return <LoadingPage text="Loading Orchestrator" />;

    return (
        <div style={{ ...STYLES.container, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {VersionLogger && <VersionLogger useEffect={useEffect} STYLES={STYLES} />}

            {Navbar ? (
                <Navbar
                    currentPage={activeTab}
                    setCurrentPage={setActiveTab}
                    navItems={navItems}
                    STYLES={STYLES}
                    AnimatedLogo={props.AnimatedLogo}
                    useIsMobile={props.useIsMobile}
                />
            ) : <div style={{ color: 'red', position: 'fixed', top: 0, zIndex: 9999 }}>NAVBAR PROP MISSING</div>}

            {activeTab === 'HOME' ? (
                <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <MarkdownRenderer
                        content="{component: RetroMorphGame}"
                        STYLES={STYLES}
                        components={boundComponents}
                        folderPath={folderPath}
                        dc={dcApi}
                        setCurrentPage={setActiveTab}
                    />
                </div>
            ) : (
                <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                    {!contentCache[activeTab] ? (
                        <LoadingPage text={`Loading ${activeTab}`} />
                    ) : (
                        <MarkdownRenderer
                            content={contentCache[activeTab]}
                            STYLES={STYLES}
                            components={boundComponents}
                            folderPath={folderPath}
                            dc={dcApi}
                            setCurrentPage={setActiveTab}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export {  WebsiteBuilder  };
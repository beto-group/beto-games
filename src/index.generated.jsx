"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { STYLES } from './styles/styles.generated.jsx';
import { WebsiteBuilder } from './components/WebsiteBuilder.generated.jsx';
import { Navbar } from './components/Navbar.generated.jsx';
import { AnimatedLogo } from './components/AnimatedLogo.generated.jsx';
import { useIsMobile } from './hooks/useIsMobile.generated.jsx';
import { HeroSection } from './components/landing/HeroSection.generated.jsx';
import { PrototypePage } from './components/landing/PrototypePage.generated.jsx';
import { MarkdownRenderer } from './components/MarkdownRenderer.generated.jsx';
import { useRouting } from './hooks/useRouting.generated.jsx';
import { ControlPanel } from './components/ControlPanel.generated.jsx';
import { DeploymentManager } from './components/DeploymentManager.generated.jsx';
import { VersionLogger } from './components/VersionLogger.generated.jsx';
import { DatacoreShim } from './components/DatacoreShim.generated.jsx';
import { Footer } from './components/Footer.generated.jsx';
import { PageRouter } from './components/PageRouter.generated.jsx';
import { View as EvolutionEngine } from './datacore/games/EvolutionEngine/index.generated.jsx';
import { View as LiveTicker } from './datacore/LiveTicker/index.generated.jsx';
import { View as GameArcade } from './datacore/GameArcade/index.generated.jsx';
import { GameCard } from './components/arcade/GameCard.generated.jsx';
import { View as GlobalLeaderboard } from './datacore/GlobalLeaderboard/index.generated.jsx';
import { View as Arena } from './datacore/Arena/index.generated.jsx';
import { View as RetroMorphGame } from './datacore/games/RetroMorphGame/src/index.generated.jsx';
import * as gitUtils_mod from './utils/gitUtils.generated.jsx';
import * as cfUtils_mod from './utils/cloudflareUtils.generated.jsx';

/**
 * View factory for 76 NextWebsite (Recreated)
 */
async function View({ folderPath, ...props }) {
    // Hooks provided by React import

    // Dynamic Imports using dc.require
    console.log("💎 [index.jsx] Starting dynamic imports...", { folderPath });
    let WebsiteBuilder, Navbar, HeroSection, PrototypePage, MarkdownRenderer, useRouting, STYLES, ControlPanel, VersionLogger, DeploymentManager, gitUtils, cfUtils, DatacoreShim, EvolutionEngine, LiveTicker, GameArcade, GameCard, GlobalLeaderboard, Arena, RetroMorphGame;

    try {
        // Load Styles
        // ({ STYLES } = await dc.require(folderPath + '/src/styles/sty... (lifted to top-level)

        // Load Utilities
        gitUtils = gitUtils_mod; // (lifted to top-level import)
        cfUtils = cfUtils_mod; // (lifted to top-level import)

        // Load Components
        // ({ WebsiteBuilder } = await dc.require(folderPath + '/src/co... (lifted to top-level)
        // ({ Navbar } = await dc.require(folderPath + '/src/components... (lifted to top-level)
        // ({ AnimatedLogo } = await dc.require(folderPath + '/src/comp... (lifted to top-level)
        // ({ useIsMobile } = await dc.require(folderPath + '/src/hooks... (lifted to top-level)
        // ({ HeroSection } = await dc.require(folderPath + '/src/compo... (lifted to top-level)
        // ({ PrototypePage } = await dc.require(folderPath + '/src/com... (lifted to top-level)
        // ({ MarkdownRenderer } = await dc.require(folderPath + '/src/... (lifted to top-level)
        // ({ useRouting } = await dc.require(folderPath + '/src/hooks/... (lifted to top-level)
        // ({ ControlPanel } = await dc.require(folderPath + '/src/comp... (lifted to top-level)
        // ({ DeploymentManager } = await dc.require(folderPath + '/src... (lifted to top-level)
        // ({ VersionLogger } = await dc.require(folderPath + '/src/com... (lifted to top-level)
        // ({ DatacoreShim } = await dc.require(folderPath + '/src/comp... (lifted to top-level)
        // ({ Footer } = await dc.require(folderPath + '/src/components... (lifted to top-level)
        // ({ PageRouter } = await dc.require(folderPath + '/src/compon... (lifted to top-level)

        // Load New Platform Components
        // ({ View: EvolutionEngine } = await dc.require(folderPath + '... (lifted to top-level)
        // ({ View: LiveTicker } = await dc.require(folderPath + '/src/... (lifted to top-level)
        // ({ View: GameArcade } = await dc.require(folderPath + '/src/... (lifted to top-level)
        // ({ GameCard } = await dc.require(folderPath + '/src/componen... (lifted to top-level)
        // ({ View: GlobalLeaderboard } = await dc.require(folderPath +... (lifted to top-level)
        // ({ View: Arena } = await dc.require(folderPath + '/src/datac... (lifted to top-level)
        // ({ View: RetroMorphGame } = await dc.require(folderPath + '/... (lifted to top-level)

    } catch (e) {
        console.error("❌ [index.jsx] Import failed:", e);
    }

    // Load Modern Fonts
    {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Outfit:wght@400;700&family=Roboto:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    const { findNearestAncestorWithClass, findDirectChildByClass } = {
        findNearestAncestorWithClass: (el, cls) => el?.closest(`.${cls}`),
        findDirectChildByClass: (el, cls) => el?.querySelector(`:scope > .${cls}`)
    }; // Simple inline domUtils for now

    function ViewComponent() {
        const instanceId = useRef(Math.random().toString(36).substr(2, 5)).current;
        const [key, setKey] = useState(0);
        const [isFullTab, setIsFullTab] = useState(!props.isInception);
        const containerRef = useRef(null);
        const stateRefs = useRef({}).current;

        const toggleFullTab = () => setIsFullTab(!isFullTab);

        // Full-tab mode lifecycle (Copied from RemotionClone)
        useEffect(() => {
            if (!isFullTab) return;
            const container = containerRef.current;
            if (!container) return;

            const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
            if (!targetPaneContent) return;

            const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
            const currentParent = container.parentNode;
            if (!currentParent) return;

            stateRefs.originalParent = currentParent;
            const placeholder = document.createElement("div");
            placeholder.className = "screen-mode-placeholder";
            placeholder.style.display = "none";

            if (container.nextSibling) {
                currentParent.insertBefore(placeholder, container.nextSibling);
            } else {
                currentParent.appendChild(placeholder);
            }
            stateRefs.placeholder = placeholder;

            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position,
            };

            if (window.getComputedStyle(contentWrapper).position === 'static') {
                contentWrapper.style.position = "relative";
            }

            contentWrapper.appendChild(container);

            requestAnimationFrame(() => {
                Object.assign(contentWrapper.style, {
                    padding: "0",
                    margin: "0",
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    minHeight: "0"
                });
            });

            Object.assign(container.style, {
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                backgroundColor: "#000000",
            });

            const styleId = `full-tab-styles-${instanceId}`;
            let styleEl = document.getElementById(styleId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                styleEl.innerHTML = `
          .status-bar { display: none !important; }
          .view-footer { display: none !important; }
          .workspace-leaf-content { height: 100% !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
          .view-content { height: 100% !important; display: flex !important; flex-direction: column !important; padding: 0 !important; }
        `;
                document.head.appendChild(styleEl);
            }

            return () => {
                const styleEl = document.getElementById(styleId);
                if (styleEl) styleEl.remove();

                if (stateRefs.placeholder?.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                } else if (stateRefs.originalParent) {
                    stateRefs.originalParent.appendChild(container);
                }

                if (stateRefs.parentPositionInfo?.element) {
                    const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
                    element.style.position = originalInlinePosition || '';
                }
                container.removeAttribute("style");
            };
        }, [isFullTab]);

        return (
            <div ref={containerRef} style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000', position: 'relative' }}>
                <ControlPanel
                    folderPath={folderPath}
                    isFullTab={isFullTab}
                    onToggleFullTab={toggleFullTab}
                    DeploymentManager={DeploymentManager}
                    gitUtils={gitUtils}
                    cfUtils={cfUtils}
                />
                <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <WebsiteBuilder
                        key={key}
                        STYLES={STYLES}
                        Navbar={Navbar}
                        Footer={Footer}
                        PageRouter={PageRouter}
                        HeroSection={HeroSection}
                        PrototypePage={PrototypePage}
                        MarkdownRenderer={MarkdownRenderer}
                        DatacoreShim={DatacoreShim}
                        folderPath={folderPath}
                        useState={useState}
                        useEffect={useEffect}
                        onToggleFullTab={toggleFullTab}
                        isFullTab={isFullTab}
                        dc={dc}
                        useRouting={useRouting}
                        VersionLogger={VersionLogger}
                        EvolutionEngine={EvolutionEngine}
                        LiveTicker={LiveTicker}
                        GameArcade={GameArcade}
                        GameCard={GameCard}
                        GlobalLeaderboard={GlobalLeaderboard}
                        Arena={Arena}
                        RetroMorphGame={RetroMorphGame}
                        AnimatedLogo={AnimatedLogo}
                        useIsMobile={useIsMobile}
                    />
                </div>
            </div>
        );
    }

    return <ViewComponent />;
}

export {  View  };
/**
 * View factory for 76 NextWebsite (Recreated)
 */
async function View({ folderPath, ...props }) {
    const { useState, useEffect, useRef } = dc;

    // Dynamic Imports using dc.require
    console.log("💎 [index.jsx] Starting dynamic imports...", { folderPath });
    let WebsiteBuilder, Navbar, HeroSection, PrototypePage, MarkdownRenderer, useRouting, STYLES, ControlPanel, VersionLogger, DeploymentManager, gitUtils, cfUtils, DatacoreShim, EvolutionEngine, LiveTicker, GameArcade, GameCard, GlobalLeaderboard, Arena, RetroMorphGame;

    try {
        // Load Styles
        ({ STYLES } = await dc.require(folderPath + '/src/styles/styles.jsx'));

        // Load Utilities
        gitUtils = await dc.require(folderPath + '/src/utils/gitUtils.js');
        cfUtils = await dc.require(folderPath + '/src/utils/cloudflareUtils.js');

        // Load Components
        ({ WebsiteBuilder } = await dc.require(folderPath + '/src/components/WebsiteBuilder.jsx'));
        ({ Navbar } = await dc.require(folderPath + '/src/components/Navbar.jsx'));
        ({ AnimatedLogo } = await dc.require(folderPath + '/src/components/AnimatedLogo.jsx'));
        ({ useIsMobile } = await dc.require(folderPath + '/src/hooks/useIsMobile.jsx'));
        ({ HeroSection } = await dc.require(folderPath + '/src/components/landing/HeroSection.jsx'));
        ({ PrototypePage } = await dc.require(folderPath + '/src/components/landing/PrototypePage.jsx'));
        ({ MarkdownRenderer } = await dc.require(folderPath + '/src/components/MarkdownRenderer.jsx'));
        ({ useRouting } = await dc.require(folderPath + '/src/hooks/useRouting.jsx'));
        ({ ControlPanel } = await dc.require(folderPath + '/src/components/ControlPanel.jsx'));
        ({ DeploymentManager } = await dc.require(folderPath + '/src/components/DeploymentManager.jsx'));
        ({ VersionLogger } = await dc.require(folderPath + '/src/components/VersionLogger.jsx'));
        ({ DatacoreShim } = await dc.require(folderPath + '/src/components/DatacoreShim.jsx'));
        ({ Footer } = await dc.require(folderPath + '/src/components/Footer.jsx'));
        ({ PageRouter } = await dc.require(folderPath + '/src/components/PageRouter.jsx'));

        // Load New Platform Components
        ({ View: EvolutionEngine } = await dc.require(folderPath + '/src/datacore/games/EvolutionEngine/index.jsx') || {});
        ({ View: LiveTicker } = await dc.require(folderPath + '/src/datacore/LiveTicker/index.jsx') || {});
        ({ View: GameArcade } = await dc.require(folderPath + '/src/datacore/GameArcade/index.jsx') || {});
        ({ GameCard } = await dc.require(folderPath + '/src/components/arcade/GameCard.jsx') || {});
        ({ View: GlobalLeaderboard } = await dc.require(folderPath + '/src/datacore/GlobalLeaderboard/index.jsx') || {});
        ({ View: Arena } = await dc.require(folderPath + '/src/datacore/Arena/index.jsx') || {});
        ({ View: RetroMorphGame } = await dc.require(folderPath + '/src/datacore/games/RetroMorphGame/src/index.jsx') || {});

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

return { View };

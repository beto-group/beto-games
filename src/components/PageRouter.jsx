function PageRouter({ activeTab, contentCache, MarkdownRenderer, components, folderPath, STYLES, routes, setCurrentPage }) {

    // 1. Special Component Routes (like Arena)
    // Check if the current route is defined as a component in the routes configuration
    // OR if it matches a pattern like PLAY/:gameId

    if (activeTab.startsWith('PLAY') || activeTab.startsWith('PLAY/')) {
        const gameId = activeTab.split('/')[1] || 'iqgame';
        // Reuse the logic from the old WebsiteBuilder for Arena
        const Arena = components.Arena; // Ensure Arena is passed in components
        const DatacoreShim = components.DatacoreShim;

        return (
            <MarkdownRenderer
                content="{component: Arena}"
                STYLES={STYLES}
                components={components}
                folderPath={folderPath}
                gameId={gameId}
                setCurrentPage={setCurrentPage}
            />
        );
    }

    // 2. Standard Markdown Routes
    const content = contentCache[activeTab] || "# Loading...";

    return (
        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <MarkdownRenderer
                content={content}
                STYLES={STYLES}
                components={components}
                folderPath={folderPath}
                setCurrentPage={setCurrentPage}
            />
        </div>
    );
}

return { PageRouter };

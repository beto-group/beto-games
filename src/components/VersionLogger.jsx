function VersionLogger({ useEffect: hookProp, STYLES = {} }) {
    // Robust detection: Obsidian has window.app, Website does not.
    // Also check for dcApi specifically passed from page.jsx
    const isDatacore = typeof window !== 'undefined' && !!window.app;
    const isWeb = typeof window !== 'undefined' && !window.app;

    const envLabel = isDatacore ? 'Datacore' : 'Website';
    const envEmoji = isDatacore ? '💎' : '🌐';
    const envColor = isDatacore ? '#00e5ff' : '#ffea00';
    const logStyle = `background: ${envColor}; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;`;

    /* 
    if (typeof window !== 'undefined') {
        console.log(`%c${envEmoji} [${envLabel}]`, logStyle, '--- VERSION LOGGER EVALUATING ---');
        if (isWeb) {
            console.log('🌐 [Web-Specific] Execution context verified as Standalone Browser');
        }
    }
    */

    const log = (message, data = null) => {
        if (typeof window === 'undefined') return;
        if (data) {
            console.log(`%c${envEmoji} [${envLabel}]`, logStyle, message, data);
        } else {
            console.log(`%c${envEmoji} [${envLabel}]`, logStyle, message);
        }
    };

    if (typeof window !== 'undefined') {
        const styleId = 'datacore-global-resets-v2';
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.innerHTML = `
                button {
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    background: none !important;
                    border: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    outline: none !important;
                    box-shadow: none !important;
                    cursor: pointer;
                    font-family: inherit;
                    color: inherit;
                    border-radius: 0 !important;
                }
                button:focus { outline: none !important; }
            `;
            document.head.appendChild(styleEl);
        }
        window.versionLogger = { log, isDatacore, envLabel };
    }

    // Use hooks from dc (injected in page.jsx for web)
    const { useEffect } = dc;

    useEffect(() => {
        // log('🚀 LIFECYCLE MOUNTED');
    }, []);

    return null;
}

return { VersionLogger };

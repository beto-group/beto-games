"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


function PrototypePage({ STYLES, MarkdownRenderer, folderPath, DatacoreComponents }) {
    // Hooks provided by React import
    const [content, setContent] = useState('Loading...');

    useEffect(() => {
        async function loadContent() {
            try {
                let fileContent = '';

                // Robust environment detection
                // Obsidian environment usually has app.vault AND window.obsidian (or similar electron indicators)
                // Mock shims usually don't have the real Obsidian app instance.
                const isRealDatacore = typeof dc !== 'undefined' && dc.app?.vault && (window.app || window.obsidian);

                if (isRealDatacore) {
                    console.log("🏗️ [PrototypePage] Loading via REAL Datacore (Obsidian)...");
                    const path = folderPath + '/src/data/content/prototype.md';
                    fileContent = await dc.app.vault.adapter.read(path);
                } else {
                    console.log("🌐 [PrototypePage] Loading via Web Fetch...");
                    // On the web, files are served from /content/ (mapped in public/ by build-shim)
                    const res = await fetch('/content/prototype.md');
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    fileContent = await res.text();
                }

                setContent(fileContent);
            } catch (e) {
                console.error("Failed to load prototype.md", e);
                setContent("Error loading content: " + e.message);
            }
        }
        loadContent();
    }, []);

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
            <h1 style={{ ...STYLES.heroTitle, fontSize: '48px', marginTop: '40px', marginBottom: '20px' }}>PROTOTYPE</h1>
            <MarkdownRenderer
                content={content}
                STYLES={STYLES}
                components={DatacoreComponents}
                folderPath={folderPath}
            />
        </div>
    );
}

export {  PrototypePage  };
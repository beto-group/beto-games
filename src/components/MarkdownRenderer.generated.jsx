"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


function MarkdownRenderer({ content, STYLES, components = {}, folderPath, ...props }) {
    const localDc = props.dc || (typeof dc !== 'undefined' ? dc : (typeof window !== 'undefined' ? window.dc : null));
    // Hooks provided by React import

    /*
    if (typeof window !== 'undefined') {
        console.log('📄 [MarkdownRenderer] Components Registry:', Object.keys(components));
    }
    */

    const parseContent = (text) => {
        if (!text) return [];

        // Split by component tags: {component: Name, props: { ... }}
        // Robust regex to handle newlines and optional props
        // Note: We scan for {component: Name ... }
        const parts = [];
        const regex = /\{component\s*:\s*([a-zA-Z0-9_]+)(?:\s*,\s*props\s*:\s*(\{[\s\S]*?\}))?\s*\}/g;

        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Text before the component
            if (match.index > lastIndex) {
                const textSegment = text.substring(lastIndex, match.index);
                if (textSegment.trim()) { // Only push if non-empty? No, keep format.
                    parts.push({ type: 'text', value: textSegment });
                }
            }

            // The component
            const name = match[1];
            let props = {};
            if (match[2]) {
                try {
                    // Safe-ish prop parsing using Function constructor to allow JS-like objects
                    let rawProps = match[2];
                    // Ensure keys are quoted if they aren't
                    // rawProps = rawProps.replace(/(\w+)\s*:/g, '"$1":'); 
                    // Actually, 'new Function' handles { key: "val" } fine.
                    props = new Function(`return ${rawProps}`)();
                } catch (e) {
                    console.error("Failed to parse props for", name, e);
                    props = { error: "Props parse failed" };
                }
            }

            parts.push({ type: 'component', name, props });
            lastIndex = regex.lastIndex;
        }

        // Remaining text
        if (lastIndex < text.length) {
            parts.push({ type: 'text', value: text.substring(lastIndex) });
        }

        return parts;
    };

    const processMarkdown = (text) => {
        if (!text) return '';
        let processed = text;

        // 1. Headers (Premium Typography)
        processed = processed.replace(/^###### (.*$)/gim, '<h6 style="color: #a1a1aa; font-weight: 600; font-size: 0.875rem; letter-spacing: 0.05em; text-transform: uppercase; margin: 32px 0 12px 0;">$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5 style="color: #d4d4d8; font-weight: 700; font-size: 1rem; margin: 32px 0 12px 0;">$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4 style="color: #e4e4e7; font-weight: 700; font-size: 1.25rem; letter-spacing: -0.01em; margin: 40px 0 16px 0;">$1</h4>')
            .replace(/^### (.*$)/gim, '<h3 style="color: #fff; font-weight: 800; font-size: 1.75rem; letter-spacing: -0.02em; margin: 64px 0 24px 0; text-transform: uppercase;">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 style="color: #fff; font-weight: 800; font-size: clamp(1.75rem, 4vw, 2.25rem); letter-spacing: -0.02em; margin: 64px 0 24px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 style="background: linear-gradient(to right, #fff, #a1a1aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: clamp(2.5rem, 6vw, 4rem); letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 48px 0;">$1</h1>');

        // 2. Horizontal Rules
        processed = processed.replace(/^-{3,}/gim, '<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 48px 0;" />');

        // 3. Blockquotes & Alerts (Grouped)
        processed = processed.replace(/((?:^\s*>.*\n?)+)/gm, (match) => {
            const lines = match.trim().split('\n');
            const toolMap = {
                'NOTE': { color: '#60a5fa', icon: 'ℹ️', bg: 'rgba(96, 165, 250, 0.1)' },
                'TIP': { color: '#34d399', icon: '💡', bg: 'rgba(52, 211, 153, 0.1)' },
                'IMPORTANT': { color: '#a855f7', icon: '💜', bg: 'rgba(168, 85, 247, 0.1)' },
                'WARNING': { color: '#fbbf24', icon: '⚠️', bg: 'rgba(251, 191, 36, 0.1)' },
                'CAUTION': { color: '#f87171', icon: '🛑', bg: 'rgba(248, 113, 113, 0.1)' }
            };

            const firstInner = lines[0].replace(/^\s*>\s?/, '');
            const alertMatch = firstInner.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

            if (alertMatch) {
                const type = alertMatch[1].toUpperCase();
                const style = toolMap[type];
                // Remove the first line (tag) and process the rest
                const contentLines = lines.slice(1).map(l => l.replace(/^\s*>\s?/, ''));
                const content = contentLines.join('<br/>'); // Simple join for now, or recurse?
                // Recursing processMarkdown on content would be better but dangerous if simple regex. 
                // Let's just return text for now or simple paragraphs.

                return `
                    <div style="margin: 24px 0; padding: 16px; border-left: 4px solid ${style.color}; background: ${style.bg}; border-radius: 0 8px 8px 0;">
                        <div style="font-weight: 700; color: ${style.color}; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                            <span>${style.icon}</span> ${type}
                        </div>
                        <div style="color: #e4e4e7; line-height: 1.6;">${content}</div>
                    </div>
                `;
            }

            // Standard Blockquote
            const content = lines.map(l => l.replace(/^\s*>\s?/, '')).join('<br/>');
            return `<blockquote style="border-left: 4px solid #6b7280; padding-left: 16px; margin: 24px 0; color: #9ca3af; font-style: italic;">${content}</blockquote>`;
        });

        // 4. Lists (Unordered & Ordered)
        processed = processed.replace(/((?:^\s*[-*+].*\n?)+)/gm, (match) => {
            const listItems = match.trim().split('\n').map(line => `<li style="margin-bottom: 12px; padding-left: 8px;">${line.replace(/^\s*[-*+]\s+/, '')}</li>`).join('');
            return `<ul style="list-style-type: disc; padding-left: 24px; margin: 32px 0; color: #d4d4d8; font-size: 1.125rem; line-height: 1.8;">${listItems}</ul>`;
        });
        processed = processed.replace(/((?:^\s*\d+\.\s*\n?)+)/gm, (match) => {
            const listItems = match.trim().split('\n').map(line => `<li style="margin-bottom: 12px; padding-left: 8px;">${line.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
            return `<ol style="list-style-type: decimal; padding-left: 24px; margin: 32px 0; color: #d4d4d8; font-size: 1.125rem; line-height: 1.8;">${listItems}</ol>`;
        });

        // 5. Formatting
        processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-weight: 600;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em style="color: #e5e7eb;">$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); padding: 2px 6px; borderRadius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.9em; color: #e4e4e7;">$1</code>');

        // 6. Links
        processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            // Check if it's the specific CTA link or a general link (optional heuristic)
            const isCTA = text.includes('ENTER THE FORGE') || text.includes('DOWNLOAD');

            if (isCTA) {
                return `<a href="${url}" target="_blank" class="premium-cta-button">${text}</a>`;
            }

            const style = "color: #fff; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.4); text-underline-offset: 4px; transition: text-decoration-color 0.2s;";
            return `<a href="${url}" target="_blank" style="${style}">${text}</a>`;
        });

        // 8. Custom Footer Styling (Specific Replacements for ABOUT.mdoc)
        // Grouping the footer headlines to center them
        processed = processed.replace(
            /<h3[^>]*>Don't just take notes.<\/h3>\s*<h3[^>]*><strong><em>Build the future.<\/em><\/strong><\/h3>|<h3[^>]*>Don't just take notes.<\/h3>\s*<h3[^>]*>.*Build the future.*<\/h3>/gim,
            `
            <div style="text-align: center; margin: 80px 0 40px 0;">
                <h3 style="color: #52525b; font-weight: 700; font-size: 2rem; margin: 0; line-height: 1.2;">Don't just take notes.</h3>
                <h3 style="background: linear-gradient(to right, #fff, #a1a1aa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 3rem; margin: 8px 0 0 0; line-height: 1.1; text-transform: uppercase; letter-spacing: -0.02em;">Build the future.</h3>
            </div>
            `
        );

        // Also center the button if it follows the footer text (using a broad center wrapper if needed, or just applying text-align center to the parent of the button if we can target it. 
        // A safer way is to wrap the whole bottom section if we can identify it, OR just rely on the fact that we can wrap the link in a center div if it is the CTA.)
        processed = processed.replace(/(<a [^>]*>[\s\S]*?ENTER THE FORGE[\s\S]*?<\/a>)/g, '<div style="text-align: center; margin-bottom: 96px;">$1</div>');

        // 7. Paragraphs
        processed = processed.split(/\n\s*\n/).map(p => {
            if (p.trim().match(/<h[1-6]|<ul|<ol|<div|<blockquote|<hr/)) return p;
            return `<p style="margin-bottom: 24px; line-height: 1.8; color: #d4d4d8; font-size: 1.125rem; letter-spacing: -0.01em;">${p}</p>`;
        }).join('\n');

        return processed;
    };

    const parsed = parseContent(content);

    // Check if content is primarily a full-view component to remove wrapper padding
    const hasFullViewComponent = parsed.some(p => p.type === 'component' && ['RetroMorphGame', 'EvolutionEngine', 'Arena', 'GlobalLeaderboard', 'GameArcade'].includes(p.name));

    const containerStyle = hasFullViewComponent
        ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }
        : { maxWidth: '850px', margin: '0 auto', width: '100%', padding: '64px 24px 128px 24px' };

    return (
        <div style={{ ...STYLES.contentWrapper, flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
            <style>
                {`
                    .premium-cta-button {
                        display: inline-block;
                        margin-top: 32px;
                        padding: 18px 48px;
                        background: #000;
                        color: #fff;
                        font-weight: 800;
                        text-decoration: none;
                        border-radius: 4px;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                        border: 2px solid #fff;
                        box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
                        transition: all 0.3s ease;
                    }
                    .premium-cta-button:hover {
                        background: #fff;
                        color: #000;
                        transform: scale(1.05);
                        box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
                    }
                `}
            </style>
            <div style={containerStyle}>
                {parsed.map((part, i) => {
                    if (part.type === 'text') {
                        return (
                            <div key={i} style={{ padding: '40px 20px' }} dangerouslySetInnerHTML={{ __html: processMarkdown(part.value) }} />
                        );
                    } else if (part.type === 'component') {
                        // 1. Try Local Registry (injected via props)
                        const LocalComponent = components[part.name];

                        // Validate: Must be a function (Component) or valid React element/component type
                        const isValidComponent = LocalComponent && (
                            typeof LocalComponent === 'function' ||
                            (typeof LocalComponent === 'object' && (
                                LocalComponent.$$typeof || // React Element/Component
                                typeof LocalComponent.render === 'function' || // forwardRef
                                LocalComponent.type // memo/other wrappers
                            ))
                        );

                        if (typeof window !== 'undefined' && !isValidComponent && LocalComponent) {
                            console.warn(`⚠️ [MarkdownRenderer] Component "${part.name}" is invalid (found object with keys: ${Object.keys(LocalComponent).join(',')})`);
                        }

                        if (isValidComponent && part.name !== 'DatacoreShim') {

                            // Check if this is a "Full View" component that needs 100% height/width
                            const isFullView = ['RetroMorphGame', 'EvolutionEngine', 'Arena', 'GlobalLeaderboard', 'GameArcade'].includes(part.name);

                            if (isFullView) {
                                // Use DatacoreShim as a universal resolver for async components
                                const Shim = components.DatacoreShim;
                                if (Shim) {
                                    return (
                                        <div key={i} style={{ width: '100%', height: 'calc(100vh - 80px)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            <Shim
                                                component={LocalComponent}
                                                name={part.name}
                                                componentProps={part.props}
                                                folderPath={folderPath}
                                                STYLES={STYLES}
                                                components={components}
                                                dc={localDc}
                                                {...props}
                                            />
                                        </div>
                                    );
                                }
                            }

                            // Use DatacoreShim as a universal resolver for async components
                            const Shim = components.DatacoreShim;
                            if (Shim) {
                                return (
                                    <div key={i} style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <Shim
                                            component={LocalComponent}
                                            name={part.name}
                                            componentProps={part.props}
                                            folderPath={folderPath}
                                            STYLES={STYLES}
                                            components={components}
                                            dc={localDc}
                                            {...props}
                                        />
                                    </div>
                                );
                            }

                            // Fallback (should not happen if Shim is passed)
                            return (
                                <div key={i} style={{ margin: '30px 0', width: '100%' }}>
                                    <LocalComponent {...part.props} STYLES={STYLES} dc={localDc} {...props} />
                                </div>
                            );
                        }

                        // 2. Fallback to Dynamic Loader (Shim)
                        const Shim = components.DatacoreShim;
                        if (!Shim) return <div key={i}>Error: DatacoreShim missing</div>;

                        return (
                            <div key={i} style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <Shim
                                    name={part.name}
                                    componentProps={part.props}
                                    folderPath={folderPath}
                                    STYLES={STYLES}
                                    components={components}
                                    dc={localDc}
                                    {...props}
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

export {  MarkdownRenderer  };
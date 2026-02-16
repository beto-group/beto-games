"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


/**
 * useRouting: Encapsulates routing logic for the website
 * Detects environment and syncs sidebarTab with window.location
 */
function useRouting({ sidebarTab, setSidebarTab, isMounted, dcApi }) {
    // Hooks provided by React import
    const initialSyncDone = useRef(false);

    // Sync URL when tab changes (Web Only)
    useEffect(() => {
        if (typeof window === 'undefined' || !isMounted || !dcApi) return;

        // Detect if we are in the web environment (shimmed dc) or real Obsidian
        // The shim's getBasePath returns an empty string or null usually, or we check specific props
        const isObsidian = !!(dcApi?.app?.vault?.adapter?.getBasePath && dcApi.app.vault.adapter.getBasePath());
        const isWeb = !isObsidian;

        if (isWeb) {
            // Block URL updates until we've processed the initial URL
            if (!initialSyncDone.current) return;

            const rawPath = window.location.pathname.replace(/^\/|\/$/g, '');
            const isRootAdmin = rawPath.toLowerCase() === 'admin' || rawPath.toLowerCase().startsWith('admin/');
            if (isRootAdmin) return; // STOP hijacking admin

            // Case-insensitive comparison to avoid infinite loops if only case differs
            const currentPathUpper = rawPath === '' ? 'HOME' : rawPath.toUpperCase();

            // If the current URL (normalized to state) doesn't match the active tab...
            if (currentPathUpper !== sidebarTab && !rawPath.startsWith('admin') && !rawPath.startsWith('ADMIN')) {
                console.log("[useRouting] Syncing URL from state:", sidebarTab);
                // Force Lowercase URL for aesthetics
                const newPath = sidebarTab === 'INDEX' || sidebarTab === 'HOME' ? '/' : `/${sidebarTab.toLowerCase()}`;
                window.history.pushState(null, '', newPath);
            }
        }
    }, [sidebarTab, isMounted, dcApi]);

    // Initial Load & PopState (Web Only)
    useEffect(() => {
        if (typeof window === 'undefined' || !isMounted || !dcApi) return;

        const isObsidian = !!(dcApi?.app?.vault?.adapter?.getBasePath && dcApi.app.vault.adapter.getBasePath());
        const isWeb = !isObsidian;

        if (isWeb) {
            console.log("[useRouting] Web Environment Detected - Initializing Routing");

            const updateStateFromUrl = () => {
                const rawPath = window.location.pathname.replace(/^\/|\/$/g, '');
                const isRootAdmin = rawPath.toLowerCase() === 'admin' || rawPath.toLowerCase().startsWith('admin/');
                if (isRootAdmin) {
                    console.log("[useRouting] Admin route detected - ignoring");
                    initialSyncDone.current = true; // Mark as done to avoid future interference
                    return;
                }

                // FORCE UPPERCASE STATE (Matches file system convention: LINK.md, PROTOTYPE.md)
                const finalTab = rawPath === '' ? 'HOME' : rawPath.toUpperCase();

                console.log("[useRouting] Syncing state from URL:", finalTab, "Location:", window.location.pathname);
                if (finalTab === 'KEYSTATIC') {
                    console.warn("[useRouting] KEYSTATIC STATE DETECTED! Printing stack trace.");
                    console.trace();
                }
                setSidebarTab(finalTab);

                // DATACORE HACK: Mark initial sync as done immediately after setting state
                // This allows the other effect to take over for future updates
                initialSyncDone.current = true;
            };

            // Initial sync
            updateStateFromUrl();

            // Listen for back/forward
            const handlePopState = () => {
                console.log("[useRouting] PopState detected");
                updateStateFromUrl();
            };

            window.addEventListener('popstate', handlePopState);
            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [isMounted, dcApi, setSidebarTab]);
}

export {  useRouting  };
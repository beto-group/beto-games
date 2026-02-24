'use client';
import { useState, useEffect } from 'react';

/**
 * usePWAInstall
 * Handles the PWA "Add to Home Screen" install flow for:
 * - Android Chrome: uses beforeinstallprompt event
 * - iOS Safari: shows manual instructions (iOS doesn't support beforeinstallprompt)
 *
 * Usage:
 *   const { canInstall, isIOS, installApp, showIOSInstructions, setShowIOSInstructions } = usePWAInstall();
 */
export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Detect iOS (iPhone/iPad)
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setIsIOS(ios);

        // Detect if already installed as standalone PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
        setIsInstalled(standalone);

        if (standalone) return; // Already installed, nothing to do

        if (ios) {
            // iOS: always show the option (user taps Share → Add to Home Screen manually)
            setCanInstall(true);
            return;
        }

        // Android / Chrome: listen for the beforeinstallprompt event
        const handler = (e) => {
            e.preventDefault(); // Prevent default mini-infobar
            setDeferredPrompt(e);
            setCanInstall(true);
            console.log('[PWA] beforeinstallprompt captured ✓');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setCanInstall(false);
            setDeferredPrompt(null);
            console.log('[PWA] App installed ✓');
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => console.log('[PWA] Service worker registered:', reg.scope))
                .catch((err) => console.warn('[PWA] Service worker registration failed:', err));
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }

        if (!deferredPrompt) {
            console.warn('[PWA] No install prompt available');
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User choice:', outcome);
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
            setCanInstall(false);
        }
    };

    return { canInstall, isIOS, isInstalled, installApp, showIOSInstructions, setShowIOSInstructions };
}

"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


/**
 * HeroSection.jsx
 * Landing hero for BETO.GROUP website.
 * Self-manages PWA install (Add to Home Screen) — Android + iOS.
 */

function HeroSection({ STYLES, title, subtitle, buttonText, dc }) {
    // Safe hook resolution — _useState/_useEffect don't shadow React imports added by the shim
    const localDc = dc || (typeof window !== 'undefined' ? window.dc : null);
    const _useState = (typeof useState !== 'undefined' ? useState : null) || localDc?.useState;
    const _useEffect = (typeof useEffect !== 'undefined' ? useEffect : null) || localDc?.useEffect;

    const displayTitle = title || "BETO.GROUP";
    const displaySubtitle = subtitle || "An ecosystem for creators, thinkers, and players. We build connections beyond the now.";
    const displayButton = buttonText || "EXPLORE THE CORE";

    // PWA install state
    const [deferredPrompt, setDeferredPrompt] = _useState(null);
    const [canInstall, setCanInstall] = _useState(false);
    const [isIOS, setIsIOS] = _useState(false);
    const [isInstalled, setIsInstalled] = _useState(false);
    const [showIOSGuide, setShowIOSGuide] = _useState(false);

    _useEffect(() => {
        if (typeof window === 'undefined') return;

        // Detect iOS
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        setIsIOS(ios);

        // Detect if already installed as PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
        setIsInstalled(standalone);

        if (standalone) return;

        // iOS: show manual instructions option
        if (ios) {
            setCanInstall(true);
            return;
        }

        // Android Chrome: capture beforeinstallprompt
        const onPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setCanInstall(false);
            setDeferredPrompt(null);
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => { });
        }

        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === 'accepted') setCanInstall(false);
    };

    // Button label logic
    const installLabel = isInstalled
        ? '✓ INSTALLED'
        : isIOS
            ? '⊕ ADD TO HOME SCREEN'
            : canInstall
                ? '⊕ INSTALL APP'
                : displayButton;

    return (
        <section style={STYLES.heroSection}>
            {/* iOS "Add to Home Screen" instruction modal */}
            {showIOSGuide && (
                <div
                    onClick={() => setShowIOSGuide(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'flex-end',
                        padding: '0 0 40px 0',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '20px',
                            padding: '32px 28px',
                            maxWidth: '360px',
                            width: '90%',
                            textAlign: 'center',
                            color: '#fff',
                        }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📱</div>
                        <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.05em' }}>
                            ADD TO HOME SCREEN
                        </h3>
                        <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                            Tap the <strong style={{ color: '#fff' }}>Share</strong> button&nbsp;
                            <span style={{ fontSize: '1.2em' }}>⎋</span> in Safari, then tap&nbsp;
                            <strong style={{ color: '#fff' }}>"Add to Home Screen"</strong>.
                        </p>
                        <button
                            onClick={() => setShowIOSGuide(false)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: '#fff',
                                color: '#000',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '800',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                letterSpacing: '0.05em',
                            }}
                        >
                            GOT IT
                        </button>
                    </div>
                    {/* Arrow pointing down to Safari toolbar */}
                    <div style={{
                        marginTop: '16px',
                        color: '#fff',
                        fontSize: '1.5rem',
                        opacity: 0.6,
                        animation: 'bounce 1.2s infinite',
                    }}>▼</div>
                    <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h1 style={STYLES.heroTitle}>
                    {displayTitle}
                </h1>

                <h2 style={{ ...STYLES.heroTitle, marginTop: '-0.1em', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.35em',
                        letterSpacing: '0.4em',
                        color: '#71717a',
                        fontWeight: '400',
                        marginTop: '0.2em'
                    }}>BEYOND THE</span>
                    <span>NOW</span>
                </h2>

                <h2 style={{ ...STYLES.heroTitle, marginTop: '-0.1em', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.35em',
                        letterSpacing: '0.4em',
                        color: '#71717a',
                        fontWeight: '400',
                        marginTop: '0.2em'
                    }}>WE</span>
                    <span>BUILD</span>
                </h2>
            </div>

            <p style={STYLES.heroSubtitle}>
                {displaySubtitle}
            </p>

            <button
                style={{
                    ...STYLES.ctaButton,
                    opacity: isInstalled ? 0.5 : 1,
                    cursor: isInstalled ? 'default' : 'pointer',
                }}
                disabled={isInstalled}
                onClick={handleInstall}
                onMouseEnter={(e) => {
                    if (isInstalled) return;
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.backgroundColor = "#f4f4f5";
                }}
                onMouseLeave={(e) => {
                    if (isInstalled) return;
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                }}
            >
                {installLabel}
            </button>
        </section>
    );
}

export {  HeroSection  };
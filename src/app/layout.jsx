import settings from '../data/settings.generated.json';

// export const runtime = 'edge';

// Static metadata from pre-generated JSON
function getSettings() {
    return settings || {};
}

export async function generateMetadata() {
    const settings = getSettings();
    const siteTitle = settings.title || 'Nexus Core | The Next-Gen Software Platform';
    const siteDesc = settings.description || 'Build, deploy, and manage futuristic web applications with Nexus Core.';
    const siteKeywords = (settings.keywords || 'Next.js, Datacore, AI, Software Platform, Premium Design').split(',').map(k => k.trim());

    return {
        title: siteTitle,
        description: siteDesc,
        keywords: siteKeywords,
        authors: [{ name: 'Nexus Team' }],
        robots: 'index, follow',
        metadataBase: new URL('https://nexuscore.app'),
        icons: {
            icon: [
                { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
                { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            ],
            shortcut: '/favicon.ico',
            apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            other: [
                { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            ],
        },
        manifest: '/manifest.json',
        openGraph: {
            title: siteTitle,
            description: siteDesc,
            url: 'https://nexuscore.app',
            siteName: 'Nexus Core',
            images: [
                {
                    url: '/branding/nexus-og.png',
                    width: 1200,
                    height: 630,
                    alt: 'Nexus Core Platform Preview',
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: siteTitle,
            description: siteDesc,
            images: ['/branding/nexus-og.png'],
        },
    }
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Outfit:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
                <style>{`
                    * { box-sizing: border-box; }
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: #000;
                        font-family: 'Inter', sans-serif; /* Explicitly set default font */
                    }
                    button { font-family: inherit; }
                `}</style>
            </head>
            <body>
                {/* 
                  * PWA Early Capture Script
                  * Runs synchronously BEFORE React mounts — captures beforeinstallprompt
                  * which fires very early (often before components mount).
                  * Stores on window.__pwaInstallPrompt so HeroSection can read it immediately.
                  * Also dispatches 'pwa-install-ready' for components that mount after the event.
                */}
                <script dangerouslySetInnerHTML={{
                    __html: `
                    (function() {
                        // Register service worker immediately
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.register('/sw.js').catch(function() {});
                        }
                        // Capture beforeinstallprompt before React mounts
                        window.addEventListener('beforeinstallprompt', function(e) {
                            e.preventDefault();
                            window.__pwaInstallPrompt = e;
                            // Dispatch custom event for late-mounting components
                            window.dispatchEvent(new CustomEvent('pwa-install-ready', { detail: e }));
                        });
                        // Track installed state
                        window.addEventListener('appinstalled', function() {
                            window.__pwaInstalled = true;
                            window.__pwaInstallPrompt = null;
                            window.dispatchEvent(new CustomEvent('pwa-installed'));
                        });
                    })();
                ` }} />
                {children}
            </body>
        </html>
    )
}

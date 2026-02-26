import settings from '../data/settings.generated.json';

// export const runtime = 'edge';

// Root layout handles global styles and fonts.
// Metadata is handled at the page level to allow for dynamic PWA manifest switching.

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

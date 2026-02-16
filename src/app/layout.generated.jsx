"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


export const metadata = {
    title: 'Nexus Core | The Next-Gen Software Platform',
    description: 'Build, deploy, and manage futuristic web applications with Nexus Core. Designed for high performance and premium aesthetics.',
    keywords: ['Next.js', 'Datacore', 'AI', 'Software Platform', 'Premium Design'],
    authors: [{ name: 'Nexus Team' }],
    authors: [{ name: 'Nexus Team' }],
    robots: 'index, follow',
    metadataBase: new URL('https://nexuscore.app'),
    icons: {
        icon: '/icon.png',
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    openGraph: {
        title: 'Nexus Core | The Next-Gen Software Platform',
        description: 'Experience the future of web building with Nexus Core.',
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
        title: 'Nexus Core | The Next-Gen Software Platform',
        description: 'Build the future with Nexus Core.',
        images: ['/branding/nexus-og.png'],
    },
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
            <body>{children}</body>
        </html>
    )
}

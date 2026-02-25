import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');

    const baseManifest = {
        "name": "Nexus Core",
        "short_name": "Nexus",
        "description": "The Next-Gen Software Platform",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#000000",
        "theme_color": "#000000",
        "icons": [
            {
                "src": "/icon-192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any maskable"
            },
            {
                "src": "/icon-512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
            }
        ]
    };

    if (game) {
        // Customize for the specific game
        const gameName = game.toUpperCase() === 'IQGAME' ? 'IQ Game' : game;
        baseManifest.name = `Nexus: ${gameName}`;
        baseManifest.short_name = gameName;
        baseManifest.start_url = `/?game=${encodeURIComponent(game)}`;
    }

    return NextResponse.json(baseManifest);
}

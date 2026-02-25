import { NextResponse } from 'next/server';
import settings from '../../../data/settings.generated.json';

export const runtime = 'edge';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game');

    // Source branding from SETTINGS.md but fallback to BETO.GROUP for PWA
    const settingsTitle = settings.title?.split('|')[0]?.trim() || "BETO.GROUP";
    const brandPrefix = "BETO.GROUP";

    const baseManifest = {
        "name": brandPrefix,
        "short_name": "BETO",
        "description": settings.description || "The Next-Gen Meta-Game Platform",
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
        // Individual Game Branding: "BETO.GROUP - IQ GAMES"
        const gameID = game.toUpperCase();
        const displayGameName = gameID === 'IQGAME' ? 'IQ GAMES' : gameID.replace(/GAME$/, ' GAMES');

        baseManifest.name = `${brandPrefix} - ${displayGameName}`;
        baseManifest.short_name = displayGameName;
        baseManifest.start_url = `/?game=${encodeURIComponent(game)}`;

        // Use id and scope to ensure the OS treats this as a separate app from the main site
        baseManifest.id = `game-${game.toLowerCase()}`;
        // baseManifest.scope = `/?game=${encodeURIComponent(game)}`; // Scope can be tricky, keeping it broad for now but unique ID usually suffices for 'separate app' behavior in Chromium
    }

    return NextResponse.json(baseManifest);
}

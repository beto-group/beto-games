import ClientHome from './client_page';
import settings from '../../data/settings.generated.json';

export const runtime = 'edge';

export async function generateMetadata({ params }) {
    const slug = (await params).slug || [];
    const isGame = slug.length > 0 && (slug[0].toLowerCase() === 'play' || slug[0].toLowerCase().endsWith('game') || slug[0].toUpperCase() === 'IQGAME');

    let gameId = null;
    if (isGame) {
        gameId = slug[0].toLowerCase() === 'play' ? slug[1]?.toLowerCase() : slug[0].toLowerCase();
    }

    const siteTitle = settings.title || 'BETO.GROUP | The Next-Gen Meta-Game Platform';
    const siteDesc = settings.description || 'Build, deploy, and manage futuristic game applications with BETO.GAMES.';

    return {
        title: siteTitle,
        description: siteDesc,
        manifest: gameId ? `/api/manifest?game=${encodeURIComponent(gameId)}` : '/manifest.json',
        icons: {
            icon: [
                { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
                { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            ],
            apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        },
    }
}

export default async function Page({ params }) {
    const p = await params;
    return <ClientHome params={p} />;
}

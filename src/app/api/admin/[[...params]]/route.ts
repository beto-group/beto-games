export const runtime = 'edge';

import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '../../../../../keystatic.config';

// Lazy initialization pattern to ensure process.env is ready
const getHandler = () => {
    return makeRouteHandler({
        config,
        clientId: process.env.KEYSTATIC_GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID || 'missing-id',
        clientSecret: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.GITHUB_OAUTH_SECRET || 'missing-secret',
        secret: process.env.KEYSTATIC_SECRET || 'missing-secret',
    });
};

export const GET = async (req: Request) => {
    const handler = getHandler();

    // Debug Logging
    const url = new URL(req.url);
    const isCallback = url.pathname.includes('callback');

    if (isCallback) {
        console.log(`[Keystatic Debug] Callback Request! Code present: ${url.searchParams.has('code')}`);
        console.log(`[Keystatic Debug] Incoming Cookies: ${req.headers.get('cookie') || 'NONE'}`);
    } else {
        console.log(`[Keystatic] ${req.method} ${url.pathname}`);
    }

    const res = await handler.GET(req);

    // DEBUG: Log Crypto availability (Suspected cause of missing state)
    // Keystatic needs crypto for random state generation.
    if (url.pathname.includes('/login')) {
        console.log(`[Keystatic Debug] Crypto Available: ${!!globalThis.crypto}`);
        console.log(`[Keystatic Debug] RandomUUID Available: ${!!globalThis.crypto?.randomUUID}`);
        console.log(`[Keystatic Debug] GetRandomValues Available: ${!!globalThis.crypto?.getRandomValues}`);

        const location = res.headers.get('location');
        if (location) console.log(`[Keystatic Debug] Redirect Location: ${location}`);
    }

    // ERROR TRAP: If callback fails (401/500), return detailed diagnostics to user
    if (isCallback && !res.ok) {
        const errorBody = await res.clone().text();
        const diag = {
            error: "Keystatic Authentication Failed",
            upstreamStatus: res.status,
            upstreamError: errorBody || 'No error message',
            incomingToken: url.searchParams.get('code') ? 'PRESENT' : 'MISSING',
            incomingCookies: req.headers.get('cookie') || 'NONE',
            envStatus: {
                hasClientId: !!(process.env.KEYSTATIC_GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID),
                hasClientSecret: !!(process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.GITHUB_OAUTH_SECRET),
                hasSecret: !!process.env.KEYSTATIC_SECRET,
            }
        };

        return new Response(JSON.stringify(diag, null, 2), {
            status: res.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Intercept to check/fix cookies for Brave/Edge compatibility
    if (res.headers.has('set-cookie')) {
        const cookies = res.headers.get('set-cookie');
        console.log(`[Keystatic Debug] Setting Cookie: ${cookies}`);

        // Rewrite cookie to be more permissive for OAuth redirects
        if (cookies) {
            let newCookie = cookies;

            // Enforce SameSite=Lax (Fixes Brave Blocking)
            if (newCookie.includes('SameSite=Strict')) {
                newCookie = newCookie.replace(/SameSite=Strict/g, 'SameSite=Lax');
            } else if (!newCookie.includes('SameSite=')) {
                newCookie += '; SameSite=Lax';
            }

            // Enforce Secure (Required for HTTPS)
            if (!newCookie.includes('Secure')) {
                newCookie += '; Secure';
            }

            // Enforce Path=/ (Ensure visibility)
            if (!newCookie.includes('Path=/')) {
                // Replace existing path or append
                if (newCookie.includes('Path=')) {
                    newCookie = newCookie.replace(/Path=[^;]+/, 'Path=/');
                } else {
                    newCookie += '; Path=/';
                }
            }

            console.log('[Keystatic Debug] Rewrote Cookie:', newCookie);

            const newHeaders = new Headers(res.headers);
            newHeaders.set('set-cookie', newCookie);

            return new Response(res.body, {
                status: res.status,
                statusText: res.statusText,
                headers: newHeaders
            });
        }
    }

    return res;
}

export const POST = async (req: Request) => {
    const handler = getHandler();
    return handler.POST(req);
};

export const runtime = 'edge';

export async function GET(request) {
    const secret = process.env.KEYSTATIC_SECRET || '';
    const secretStatus = secret.length >= 32 ? 'OK (Valid Length)' : `WARNING (Too Short: ${secret.length} chars)`;

    const envStatus = {
        KEYSTATIC_GITHUB_CLIENT_ID: process.env.KEYSTATIC_GITHUB_CLIENT_ID ? 'OK (Present)' : 'MISSING',
        KEYSTATIC_GITHUB_CLIENT_SECRET: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET ? 'OK (Present)' : 'MISSING',
        KEYSTATIC_SECRET: process.env.KEYSTATIC_SECRET ? secretStatus : 'MISSING',
        GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID ? 'OK (Present)' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
        runtime: 'edge',
        url: request.url
    };

    return new Response(JSON.stringify(envStatus, null, 2), {
        headers: {
            'content-type': 'application/json',
        },
    });
}

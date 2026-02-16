export const runtime = 'edge';

export async function GET(request) {
    const headers = new Headers();
    headers.set('Set-Cookie', 'test-cookie=worked; Path=/; SameSite=Lax; Secure');

    return new Response('Cookie Test - Check your Network Tab for Set-Cookie header', {
        headers: headers,
        status: 200
    });
}

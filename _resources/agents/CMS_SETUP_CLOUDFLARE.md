# CMS Setup Guide: Cloudflare Pages + Edge Runtime

This guide documents the complete configuration required to run the **Keystatic CMS** (`/admin`) and the **Next.js
Website** on Cloudflare Pages using the **Edge Runtime**.

> **Note**: This replaces the previous "Static HTML Export" approach. We now use Server-Side Rendering (SSR) at the Edge
to support dynamic API routes for the CMS.

---

## 1. Runtime Configuration

### Edge Runtime (Crucial)
To run dynamic API routes (like Keystatic's GitHub auth) on Cloudflare, we must use the Edge Runtime, NOT Node.js and
NOT Static Export.

**File:** `src/app/layout.jsx` & `src/app/[[...slug]]/page.jsx`
```javascript
export const runtime = 'edge'; // Forces Cloudflare Workers mode
```

**File:** `next.config.js`
```javascript
const nextConfig = {
// output: 'export', // <--- REMOVED. Do NOT use static export. images: { unoptimized: true }, // Required for
    Cloudflare Pages (unless using paid Image Resizing) } ``` ### Build Command We use `@cloudflare/next-on-pages` to
    adapt the Next.js build for the Edge. **File:** `package.json` ```json "scripts" : { "pages:build"
    : "npx @cloudflare/next-on-pages" } ``` **Cloudflare Settings:** - **Build Command**: `npm run pages:build` -
    **Output Directory**: `.vercel/output/static` --- ## 2. Environment Variables The following variables MUST be set in
    **Cloudflare Pages> Settings > Environment Variables** for the CMS to work.

    | Variable | Description |
    | :--- | :--- |
    | `KEYSTATIC_GITHUB_CLIENT_ID` | OAuth Client ID from your GitHub App. |
    | `KEYSTATIC_GITHUB_CLIENT_SECRET` | OAuth Client Secret from your GitHub App. |
    | `KEYSTATIC_SECRET` | A random long string for session encryption (e.g. `openssl rand -base64 32`). |
    | `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | (Optional) The slug of your GitHub App. |

    > **Important**: After adding or changing these, you **MUST Redeploy** for them to take effect.

    ---

    ## 3. Cloudflare Platform Settings

    ### Compatibility Flags
    The Edge Runtime requires Node.js polyfills for certain unrelated libraries (like database drivers or buffers used
    by some deps).

    **Go to:** Settings > Functions > Compatibility Flags
    **Add:** `nodejs_compat`

    > **Failure to do this** will result in **500 / 503 Errors** on the homepage (`Service Unavailable`) because the
    worker crashes on startup.

    ---

    ## 4. API Routes & Authentication Fixes

    ### Admin API Route
    The route handler at `src/app/api/admin/[[...params]]/route.ts` manages the CMS backend.

    **Key Functionality:**
    1. **Edge Runtime**: `export const runtime = 'edge';`
    2. **Lazy Initialization**: We initialize `makeRouteHandler` *inside* the request handler to avoid race conditions
    where environment variables aren't yet available.
    3. **Cookie Interceptor (Brave/Shields Fix)**: We intercept the response and rewrite cookies to `SameSite=Lax`.

    ```typescript
    // src/app/api/admin/[[...params]]/route.ts
    import { makeRouteHandler } from '@keystatic/next/route-handler';
    import config from '../../../../../keystatic.config';

    // Lazy initialization to ensure process.env is populated in Edge Runtime
    const getHandler = () => {
    return makeRouteHandler({
    config,
    clientId: process.env.KEYSTATIC_GITHUB_CLIENT_ID || 'missing-id',
    clientSecret: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || 'missing-secret',
    secret: process.env.KEYSTATIC_SECRET || 'missing-secret',
    });
    };

    export const GET = async (req: Request) => {
    const handler = getHandler(); // Initialize on request
    const res = await handler.GET(req);

    // Fix for Brave/Safari blocking Strict cookies during OAuth redirect
    if (res.headers.has('set-cookie')) {
    const cookies = res.headers.get('set-cookie');
    if (cookies && cookies.includes('SameSite=Strict')) {
    const newHeaders = new Headers(res.headers);
    const newCookie = cookies.replace(/SameSite=Strict/g, 'SameSite=Lax');
    newHeaders.set('set-cookie', newCookie);
    return new Response(res.body, { headers: newHeaders, status: res.status });
    }
    }
    return res;
    }

    export const POST = async (req: Request) => {
    const handler = getHandler();
    return handler.POST(req);
    };
    ```

    ### GitHub OAuth App Settings
    - **Homepage URL**: `https://your-site.com`
    - **Callback URL**: `https://your-site.com/api/admin/github/oauth/callback`

    ---

    ## 5. Deployment Utilities

    ### Git Commit Fix (`gitUtils.js`)
    The `initializeAndPush` function in `src/utils/gitUtils.js` handles saving content from the CMS back to GitHub.

    **Issue**: If you save without making changes, `git commit` fails, crashing the CMS save flow.
    **Fix**: We check `git status --porcelain` before committing.

    ```javascript
    // src/utils/gitUtils.js
    const status = child_process.execSync('git status --porcelain', ...);
    if (status.toString().trim() === '') {
    console.log('Nothing to commit, skipping...');
    return; // Skip commit, proceed to push
    }
    ```

    ---

    ## 6. Troubleshooting Common Errors

    ### "Authorization Failed" (401)
    - **Cause 1**: Missing `KEYSTATIC_SECRET` or Client ID/Secret mismatch.
    - **Cause 2**: Browser blocked the "State" cookie (Brave Shields).
    - **Fix**: Check Env Vars in Cloudflare. If Brave, ensure the `SameSite=Lax` patch is applied (see Section 4).

    ### "503 Service Unavailable"
    - **Cause**: Missing `nodejs_compat` flag in Cloudflare.
    - **Fix**: Add the flag in Settings > Functions and **Redeploy**.

    ### "404 Not Found" on Login
    - **Cause**: `KEYSTATIC_GITHUB_CLIENT_ID` is missing, defaulting to `missing-id`.
    - **Fix**: Add the variable to Cloudflare Env Vars.
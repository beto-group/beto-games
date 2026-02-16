const util = require('util');
const exec = util.promisify(require('child_process').exec);

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Helper to make requests using curl to bypass CORS
 */
const cfRequest = async (endpoint, token, method = 'GET', body = null) => {
    const url = `${CF_API_BASE}${endpoint}`;
    // Ensure token is trimmed of whitespace
    const safeToken = token ? token.trim() : '';

    let cmd = `curl -s -X ${method} "${url}" \\
        -H "Authorization: Bearer ${safeToken}" \\
        -H "Content-Type: application/json"`;

    if (body) {
        // Escape single quotes for shell safety (basic)
        const jsonBody = JSON.stringify(body).replace(/'/g, "'\\''");
        cmd += ` -d '${jsonBody}'`;
    }

    try {
        // console.log(`[CF DEBUG] Executing: ${method} ${endpoint}`);
        const { stdout } = await exec(cmd);
        return JSON.parse(stdout);
    } catch (e) {
        console.error(`CF Request Failed [${endpoint}]`, e);
        throw new Error(`Request failed: ${e.message}`);
    }
};

/**
 * Validates Cloudflare Token
 */
const verifyToken = async (token) => {
    try {
        const data = await cfRequest('/user/tokens/verify', token);
        return data.success && data.result.status === 'active';
    } catch (e) {
        console.error('Verify Token Error', e);
        return false;
    }
};

/**
 * Gets all accounts the user has access to
 */
const getAccounts = async (token) => {
    const data = await cfRequest('/accounts', token);
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Failed to fetch accounts');
    return data.result;
};

/**
 * Creates a Cloudflare Pages project linked to a GitHub repo
 */
const createPagesProject = async (token, accountId, projectName, repoOwner, repoName, branch = 'main') => {
    const body = {
        name: projectName,
        source: {
            type: 'github',
            config: {
                owner: repoOwner,
                repo_name: repoName,
                production_branch: branch,
                pr_comments_enabled: true,
                deployments_enabled: true
            }
        },
        build_config: {
            build_command: 'npm run build',
            destination_dir: 'out',
            root_dir: ''
        }
    };

    const safeAccountId = accountId ? accountId.trim() : '';
    const data = await cfRequest(`/accounts/${safeAccountId}/pages/projects`, token, 'POST', body);

    if (!data.success) {
        const error = data.errors?.[0];
        // Code 8000009 is "Project name already exists"
        // Also check message string to be robust
        if (error?.code === 8000009 || error?.message?.includes('already exists')) {
            return { success: true, alreadyExists: true, name: projectName, subdomain: `${projectName}.pages.dev` };
        }
        throw new Error(error?.message || 'Failed to create Pages project');
    }

    return { success: true, result: data.result, subdomain: data.result.subdomain };
};

/**
 * Gets available DNS zones
 */
const getZones = async (token) => {
    // Fetch up to 50 zones to ensure we find the user's domain
    const data = await cfRequest('/zones?per_page=50', token);

    if (!data.success) {
        console.error("Zone Fetch Error:", data.errors);
        throw new Error(data.errors?.[0]?.message || 'Failed to fetch zones');
    }
    return data.result || [];
};

/**
 * Adds a CNAME record to a zone
 */
const addDNSRecord = async (token, zoneId, recordType, recordName, content, proxied = true) => {
    const body = {
        type: recordType,
        name: recordName,
        content: content,
        ttl: 1,
        proxied: proxied
    };

    const data = await cfRequest(`/zones/${zoneId}/dns_records`, token, 'POST', body);

    if (!data.success) {
        if (data.errors?.[0]?.code === 81057) {
            return { success: true, alreadyExists: true };
        }
        throw new Error(data.errors?.[0]?.message || 'Failed to add DNS record');
    }
    return { success: true, result: data.result };
};

return {
    verifyToken,
    getAccounts,
    createPagesProject,
    getZones,
    addDNSRecord,
    triggerPagesDeployment: async (token, accountId, projectName, branch = 'main') => {
        const safeAccountId = accountId ? accountId.trim() : '';
        const body = { branch }; // Cloudflare expects branch in body to trigger new deployment
        const data = await cfRequest(`/accounts/${safeAccountId}/pages/projects/${projectName}/deployments`, token, 'POST', body);

        if (!data.success) throw new Error(data.errors?.[0]?.message || 'Failed to trigger deployment');
        return { success: true, result: data.result };
    },
    deletePagesProject: async (token, accountId, projectName) => {
        const safeAccountId = accountId ? accountId.trim() : '';
        const data = await cfRequest(`/accounts/${safeAccountId}/pages/projects/${projectName}`, token, 'DELETE');
        if (!data.success) throw new Error(data.errors?.[0]?.message || 'Failed to delete project');
        return { success: true, result: data.result };
    },
    getDeployments: async (token, accountId, projectName) => {
        const safeAccountId = accountId ? accountId.trim() : '';
        const data = await cfRequest(`/accounts/${safeAccountId}/pages/projects/${projectName}/deployments?sort_by=created_on&sort_order=desc&per_page=1`, token, 'GET');

        if (!data.success) {
            const error = data.errors?.[0];
            // Code 8000007 is "Project not found" for Pages
            const isNotFound = error?.code === 8000007 || error?.message?.toLowerCase().includes('not match any of your existing projects');

            if (isNotFound) {
                return { success: false, notFound: true, error: error?.message || 'Project not found' };
            }
            throw new Error(error?.message || 'Failed to fetch deployments');
        }
        return { success: true, result: data.result }; // Returns array of deployments
    },
    getDeploymentLogs: async (token, accountId, projectName, deploymentId) => {
        const safeAccountId = accountId ? accountId.trim() : '';
        // Note: The /history/logs endpoint usually returns text/plain or a JSON with 'data' containing logs.
        // We'll trust cfRequest to parse JSON, but if it returns text we might need handling. 
        // However, CF API usually follows standard JSON envelope unless specified.
        try {
            const data = await cfRequest(`/accounts/${safeAccountId}/pages/projects/${projectName}/deployments/${deploymentId}/history/logs`, token, 'GET');
            if (!data.success) throw new Error(data.errors?.[0]?.message || 'Failed to fetch logs');
            return { success: true, result: data.result };
        } catch (e) {
            // Fallback for cases where it's 404 (no logs yet)
            console.warn("Log fetch warning:", e);
            throw e;
        }
    }
};

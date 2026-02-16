const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.react-server.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.react-server.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.worker.js',
    'node_modules/@keystatic/core/dist/keystatic-core-ui.js',
    'node_modules/@keystatic/next/dist/keystatic-next-api.js',
    'node_modules/@keystatic/next/dist/reader-refresh-client-cb4c43c9.js',
];

// Re-check filenames in node_modules/@keystatic/core/dist/ to be sure
const coreDist = path.join(process.cwd(), 'node_modules/@keystatic/core/dist');
if (fs.existsSync(coreDist)) {
    const existing = fs.readdirSync(coreDist);
    const indexMatches = existing.filter(f => f.startsWith('index-') && f.endsWith('.js'));
    indexMatches.forEach(f => {
        const p = 'node_modules/@keystatic/core/dist/' + f;
        if (!filesToPatch.includes(p)) filesToPatch.push(p);
    });
}

const rootDir = process.cwd();

filesToPatch.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`\n🔍 Patching ${file}...`);
        let content = fs.readFileSync(filePath, 'utf8');
        const startLen = content.length;
        if (startLen < 100) {
            console.warn(`   Skipping ${file} - already too small (${startLen})`);
            return;
        }

        // Safer function-based replacements
        content = content.replace(/([\/])keystatic([\/])/g, (m, s1, s2) => s1 + 'admin' + s2);
        content = content.replace(/(['"`])\/keystatic(['"`])/g, (m, q1, q2) => q1 + '/admin' + q2);
        content = content.replace(/(['"`])\/keystatic([\/])/g, (m, q1, s2) => q1 + '/admin' + s2);
        content = content.replace(/([\/])keystatic(['"`])/g, (m, s1, q2) => s1 + 'admin' + q2);

        content = content.replace(/\/api\/keystatic/g, '/api/admin');

        // Precision regex for internal routers/mappers
        content = content.replace(/\^\/api\\\/keystatic\\\/\?/g, '^/api\\/admin\\/?');
        content = content.replace(/\.split\((['"`])\/keystatic\1\)/g, (m, q1) => ".split(" + q1 + "/admin" + q1 + ")");
        content = content.replace(/\/keystatic\\\/\?/g, '/admin\\/?');

        if (!content || content.length < 100) {
            console.error(`❌ ERROR: Patching ${file} resulted in suspiciously small content (${content.length})! Bailing.`);
            // console.log("Content preview:", content.substring(0, 100));
            process.exit(1);
        }

        fs.writeFileSync(filePath, content);
        console.log(`✅ Success: ${startLen} -> ${content.length}`);
    }
});

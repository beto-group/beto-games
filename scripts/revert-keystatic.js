const fs = require('fs');
const path = require('path');

const filesToPatch = [
    'node_modules/@keystatic/core/dist/index-d59451fc.js',
    'node_modules/@keystatic/core/dist/index-dda35b1d.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.react-server.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.react-server.js',
    'node_modules/@keystatic/core/dist/keystatic-core-api-generic.worker.js',
    'node_modules/@keystatic/core/dist/keystatic-core-ui.js',
    'node_modules/@keystatic/next/dist/keystatic-next-api.js',
    'node_modules/@keystatic/next/dist/reader-refresh-client-cb4c43c9.js',
];

const rootDir = process.cwd();

filesToPatch.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`Reverting patch for ${file}...`);
        let content = fs.readFileSync(filePath, 'utf8');

        // Revert replacements (admin -> keystatic)
        content = content.replace(/\/admin\//g, '/keystatic/');
        content = content.replace(/\/admin(['"])/g, '/keystatic$1');
        content = content.replace(/\/api\/admin/g, '/api/keystatic');

        fs.writeFileSync(filePath, content);
        console.log(`Done reverting ${file}`);
    }
});

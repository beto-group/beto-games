const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const DATACORE_DIR = path.join(SRC_DIR, 'datacore');

const componentRegistry = {};

function transformComponent(content, filePath, componentRoot) {
    const imports = [];

    let transformedBody = content.replace(
        /(?:\((?:\s*\{)|(?:const\s+\{))\s*([^}]+)\s*\}\s*=\s*(?:await\s+)?(?:dc|localDc)\.require\(folderPath\s*\+\s*['"]([^'"]+)['"]\)\)?;?(?:\s*\|\|\s*\{\})?\)?;?/g,
        (match, destructuredVars, relativePath) => {
            const variables = destructuredVars.split(',').map(v => {
                const trimmed = v.trim();
                if (trimmed.includes(':')) {
                    const [original, alias] = trimmed.split(':').map(s => s.trim());
                    return `${original} as ${alias}`;
                }
                return trimmed;
            }).filter(v => v);

            const cleanedRelativePath = relativePath.startsWith('/') ? '.' + relativePath : relativePath;
            const targetPath = path.resolve(componentRoot, cleanedRelativePath);
            const currentDir = path.dirname(filePath);
            let importPath = path.relative(currentDir, targetPath);

            if (!importPath.startsWith('.')) importPath = './' + importPath;
            importPath = importPath.replace(/\.(jsx|js)$/, '.generated.jsx');

            imports.push(`import { ${variables.join(', ')} } from '${importPath}';`);
            return `// ${match.substring(0, 60).replace(/\n/g, ' ')}... (lifted to top-level)`;
        }
    );

    transformedBody = transformedBody.replace(
        /const\s+(\w+Mod)\s*=\s*(?:await\s+)?(?:dc|localDc)\.require\(folderPath\s*\+\s*['"]([^'"]+)['"]\);?/g,
        (match, modVar, relativePath) => {
            const cleanedRelativePath = relativePath.startsWith('/') ? '.' + relativePath : relativePath;
            const targetPath = path.resolve(componentRoot, cleanedRelativePath);
            const currentDir = path.dirname(filePath);
            let importPath = path.relative(currentDir, targetPath);

            if (!importPath.startsWith('.')) importPath = './' + importPath;
            importPath = importPath.replace(/\.(jsx|js)$/, '.generated.jsx');

            imports.push(`import * as ${modVar} from '${importPath}';`);
            return `// const ${modVar} = ... (lifted to top-level import)`;
        }
    );

    transformedBody = transformedBody.replace(
        /(?:\/\/\s*)?(\w+)\s*=\s*(?:await\s+)?(?:dc|localDc)\.require\(folderPath\s*\+\s*['"]([^'"]+)['"]\);?/g,
        (match, varName, relativePath) => {
            const cleanedRelativePath = relativePath.startsWith('/') ? '.' + relativePath : relativePath;
            const targetPath = path.resolve(componentRoot, cleanedRelativePath);
            const currentDir = path.dirname(filePath);
            let importPath = path.relative(currentDir, targetPath);
            if (!importPath.startsWith('.')) importPath = './' + importPath;
            importPath = importPath.replace(/\.(jsx|js)$/, '.generated.jsx');

            const modVar = varName + '_mod';
            imports.push(`import * as ${modVar} from '${importPath}';`);
            return `${varName} = ${modVar}; // (lifted to top-level import)`;
        }
    );

    let newContent = `"use client";\nimport React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';\n` +
        imports.join('\n') + `\n\n` + transformedBody;

    // 3. Robust Export Transformation
    // Pattern: return { ... } at the end of the file, NOT indented
    const exportMatch = newContent.match(/\nreturn\s+\{([\s\S]+?)\};?\s*$/);
    if (exportMatch) {
        const body = exportMatch[1];
        if (body.includes(':')) {
            newContent = newContent.replace(exportMatch[0], `\nconst ___exports = {${body}};\nexport default ___exports;\nexport const View = ___exports.View;`);
        } else {
            newContent = newContent.replace(exportMatch[0], `\nexport { ${body} };`);
        }
    }

    // 3b. Convert return <JSX /> to export default () => <JSX />, NOT indented
    newContent = newContent.replace(/\nreturn\s+(<[\s\S]+?);?\s*$/g, '\nexport default () => $1;');

    newContent = newContent.replace(/^(\s*)const\s+\{\s*(?:useState|useEffect|useRef|useCallback|useMemo)(?:\s*,\s*(?:useState|useEffect|useRef|useCallback|useMemo))*\s*\}\s*=\s*\b(?:dcApi|dc|localDc)\b\s*(?:\|\|\s*(?:\{\}|dc|dcApi|localDc))?;?/gm, '$1// Hooks provided by React import');

    const nodeStubs = {
        'util': "{ promisify: (fn) => fn || (() => {}) }",
        'path': "{ join: (...a) => a.join('/'), resolve: (...a) => a.join('/'), isAbsolute: (p) => p?.startsWith('/'), dirname: (p) => p?.split('/').slice(0,-1).join('/') || '.', basename: (p) => p?.split('/').pop() || '' }",
        'child_process': "{ exec: () => ({ on: () => {} }), spawn: () => ({ on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} }, unref: () => {} }), execSync: () => '' }",
        'fs': "{ existsSync: () => false, readFileSync: () => '', writeFileSync: () => {}, statSync: () => ({ isDirectory: () => false }), readdirSync: () => [] }",
        'electron': "{ shell: { openExternal: (url) => typeof window !== 'undefined' && window.open(url, '_blank') } }",
        'os': "{ platform: () => 'web', release: () => '0.0.0', type: () => 'Browser' }",
        'crypto': "{ randomBytes: (n) => new Uint8Array(n), createHash: () => ({ update: () => ({ digest: () => '' }) }) }",
        'events': "{ EventEmitter: class { on() {} once() {} emit() {} off() {} } }",
        'stream': "{ Readable: class {}, Writable: class {}, PassThrough: class {} }",
        'process': "{ env: {}, cwd: () => '/', platform: 'web', argv: [], nextTick: (f) => setTimeout(f, 0) }"
    };

    Object.entries(nodeStubs).forEach(([builtin, stub]) => {
        const regex = new RegExp(`require\\(['"](node:)?${builtin}['"]\\)`, 'g');
        newContent = newContent.replace(regex, `(${stub}) /* Stubbed for Web */`);
    });

    newContent = newContent.replace(/\bprocess\.env\b/g, '(typeof process !== "undefined" ? process.env : {})');

    return newContent;
}

function processSource(dir, currentComponentRoot = null) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            let nextComponentRoot = currentComponentRoot;
            if (dir === DATACORE_DIR) {
                if (file !== 'games') nextComponentRoot = fullPath;
            } else if (dir === path.join(DATACORE_DIR, 'games')) {
                nextComponentRoot = fullPath;
            }
            // Only recurse into specific directories from SRC_DIR
            if (dir === SRC_DIR && !['datacore', 'components', 'hooks', 'styles'].includes(file)) return;
            processSource(fullPath, nextComponentRoot);
        } else if ((file.endsWith('.jsx') || file.endsWith('.js')) && !file.endsWith('.generated.jsx') && !file.includes('registry')) {
            const isSrcRoot = (dir === SRC_DIR);

            if (file === 'page.jsx' && dir.includes('app')) return;
            const componentRoot = currentComponentRoot || (dir === SRC_DIR ? PROJECT_ROOT : path.dirname(fullPath));
            const content = fs.readFileSync(fullPath, 'utf8');
            const newContent = transformComponent(content, fullPath, componentRoot);
            const targetPath = fullPath.replace(/\.(jsx|js)$/, '.generated.jsx');
            fs.writeFileSync(targetPath, newContent);

            const relToDatacore = path.relative(DATACORE_DIR, targetPath);
            const pathParts = relToDatacore.split(path.sep);

            if (!isSrcRoot && (file === 'index.jsx' || (dir.includes('datacore') && file.endsWith('.generated.jsx')))) {
                let componentName = "";
                // Filter out '..' or empty parts
                const cleanParts = pathParts.filter(p => p && p !== '..');

                for (let i = cleanParts.length - 2; i >= 0; i--) {
                    if (cleanParts[i] !== 'src' && cleanParts[i] !== 'games') {
                        componentName = cleanParts[i].replace(/^\d+\s*/, '').replace(/\s+/g, '');
                        break;
                    }
                }

                if (componentName && componentName !== '.') {
                    const relPath = './' + relToDatacore.replace(/\\/g, '/').replace('.jsx', '');
                    componentRegistry[componentName] = relPath;
                    console.log(`[Shim] Registered Component: ${componentName} -> ${relPath}`);
                }
            }
        }
    });
}

function syncAndExtract(src, destBase) {
    if (!fs.existsSync(src)) return;
    const files = fs.readdirSync(src);
    const IGNORE_DIRS = ['app', 'hooks', 'utils', 'web', 'styles', 'components'];
    files.forEach(file => {
        const fullPath = path.join(src, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(file)) return;
            syncAndExtract(fullPath, destBase);
        } else {
            const relativeToSrc = path.relative(SRC_DIR, fullPath);
            let targetPath = path.join(destBase, relativeToSrc);
            if (relativeToSrc.startsWith('data/content/')) {
                targetPath = path.join(destBase, path.basename(file));
            }
            const isCode = /\.(jsx|js|tsx|ts)$/.test(file) || file.endsWith('.generated.jsx');
            if (!isCode) {
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                fs.copyFileSync(fullPath, targetPath);
            }
            if (file.endsWith('.md') || file.endsWith('.mdoc')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const match = content.match(/```jsx\n([\s\S]*?)\n```/);
                if (match && match[1]) {
                    const jsxName = path.basename(file).replace(/\.(md|mdoc)$/, '.generated.jsx');
                    const jsxPath = path.join(path.dirname(fullPath), jsxName);
                    let webJsx = `"use client";\nimport React from 'react';\n\n`;
                    let body = match[1];
                    if (body.match(/^return\s+(<[\s\S]+?);?\s*$/m)) {
                        body = body.replace(/^return\s+(<[\s\S]+?);?\s*$/gm, 'return (props) => $1;');
                        webJsx += `export async function View(dcProps) {\n    const dc = dcProps.dc || {};\n${body}\n}`;
                    } else {
                        webJsx += body;
                        webJsx = webJsx.replace(/^return\s+\{\s*View\s*\}\s*;?$/gm, 'export { View };');
                    }
                    fs.writeFileSync(jsxPath, webJsx);
                    const parts = path.basename(file).replace(/\.(md|mdoc)$/, '').split('.');
                    const componentName = parts.find(p => !['D', 'q', 'component', 'viewer', 'v1', 'v2', 'v3'].includes(p)) || parts[0];
                    if (componentName) {
                        const relPath = './' + path.relative(DATACORE_DIR, jsxPath).replace('.jsx', '');
                        componentRegistry[componentName] = relPath;
                        console.log(`[Shim] Extracted & Registered MD Component: ${componentName} -> ${relPath}`);
                    }
                }
            }
        }
    });
}

console.log('[Shim] Starting build shim...');
processSource(SRC_DIR);
const publicContent = path.join(PROJECT_ROOT, 'public/content');
syncAndExtract(SRC_DIR, publicContent);
const registryPath = path.join(DATACORE_DIR, 'registry.generated.jsx');
const registryImports = Object.entries(componentRegistry)
    .map(([name, imp]) => `    '${name}': () => import('${imp}')`)
    .join(',\n');

const registryContent = `"use client";
import React from 'react';

const loaders = {
${registryImports}
};

export const Registry = new Proxy(loaders, {
    get: function(target, prop) {
        if (prop in target) {
            return async () => {
                try {
                    const mod = await target[prop]();
                    return mod;
                } catch (e) {
                    console.error('[Registry] Failed to load component:', prop, e);
                    return { default: () => <div style={{color: 'red'}}>Failed to load {String(prop)}</div> };
                }
            };
        }
        return undefined;
    }
});

console.log('🚀 [Registry] Initialized with:', Object.keys(loaders));
`;

fs.writeFileSync(registryPath, registryContent);
console.log(`[Shim] Generated Registry with ${Object.keys(componentRegistry).length} components at ${path.relative(PROJECT_ROOT, registryPath)} `);
console.log('[Shim] Complete.');

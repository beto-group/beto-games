const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dirsToClean = ['node_modules', '.next', 'out'];

console.log('🧹 Synchronous Clean Initiated...');

// 1. Delete Build/Dependency Directories
dirsToClean.forEach(target => {
    const targetPath = path.join(projectRoot, target);
    if (fs.existsSync(targetPath)) {
        console.log(`Deleting ${target} (This may take a moment)...`);

        try {
            // Force recursive deletion
            fs.rmSync(targetPath, { recursive: true, force: true });

            // Double-check deletion (Sync operations should be instant, but FS can catch up)
            if (fs.existsSync(targetPath)) {
                console.warn(`⚠️ Warning: ${target} still exists after deletion.`);
            } else {
                console.log(`✅ Deleted ${target}`);
            }
        } catch (e) {
            console.error(`❌ Failed to delete ${target}: ${e.message}`);
        }
    }
});

// 2. Recursive Generated File Cleanup
function deleteGeneratedFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules') {
                deleteGeneratedFiles(fullPath);
            }
        } else if (entry.isFile()) {
            if (entry.name.endsWith('.generated.jsx') || entry.name.endsWith('.generated.js')) {
                try {
                    fs.unlinkSync(fullPath);
                    // console.log(`🗑️ Removed: ${entry.name}`); // Optional logging
                } catch (e) {
                    console.error(`❌ Failed to delete ${fullPath}:`, e.message);
                }
            }
        }
    }
}

console.log('🧹 Cleaning generated files in src/ ...');
deleteGeneratedFiles(path.join(projectRoot, 'src'));

console.log('✨ Cleanup Complete. Repo is clean.');

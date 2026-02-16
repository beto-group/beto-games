const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const dirsToClean = ['.next', 'out'];

console.log('🧹 Surgical Cache Clean Initiated...');

dirsToClean.forEach(target => {
    const targetPath = path.join(projectRoot, target);
    if (fs.existsSync(targetPath)) {
        console.log(`Deleting ${target}...`);
        try {
            fs.rmSync(targetPath, { recursive: true, force: true });
            console.log(`✅ Deleted ${target}`);
        } catch (e) {
            console.error(`❌ Failed to delete ${target}: ${e.message}`);
        }
    }
});

console.log('✨ Cache Cleanup Complete.');

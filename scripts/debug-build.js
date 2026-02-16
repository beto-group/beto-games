const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const nextBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'next');

console.log('🚀 Starting Diagnostic Build Wrapper...');
console.log(`📍 CWD: ${process.cwd()}`);
console.log(`🤖 Node Version: ${process.version}`);
console.log(`📦 Next Bin: ${nextBin}`);

const nextBuild = spawn(nextBin, ['build'], {
    env: {
        ...process.env,
        DEBUG: 'next:*',
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_PRIVATE_WORKER_THREADS: '0' // Force single-threaded build for CI stability
    }
});

let leftover = '';
const filterSpam = (data) => {
    const combined = leftover + data.toString();
    const lines = combined.split('\n');
    leftover = lines.pop() || ''; // Keep the last partial line

    lines.forEach(line => {
        // Filter out the massive jsconfig-paths-plugin spam
        if (line.includes('next:jsconfig-paths-plugin paths are empty, bailing out')) {
            return;
        }
        process.stdout.write(line + '\n');
    });
};

nextBuild.stdout.on('data', filterSpam);
nextBuild.stderr.on('data', filterSpam);

nextBuild.on('error', (err) => {
    console.error('❌ FAILED to start next build process:', err);
});

nextBuild.on('close', (code, signal) => {
    console.log(`\n🛑 Build process exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
        console.error(`❌ Build FAILED with code ${code}.`);
        console.error('💡 Review the logs above for the actual error (spam filtered).');
        process.exit(code || 1);
    } else {
        console.log('✅ Build SUCCESSFUL!');
    }
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION in build wrapper:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION in build wrapper:', reason);
});

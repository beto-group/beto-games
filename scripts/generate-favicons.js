#!/usr/bin/env node
/**
 * generate-favicons.js
 *
 * Automatically generates all favicon variants from public/logo.png
 * Run manually: node scripts/generate-favicons.js
 * Or automatically via: npm run dev / npm run build
 *
 * Outputs to public/:
 *   favicon.ico          – 32x32 PNG wrapped in ICO (supported by all browsers)
 *   favicon-16x16.png
 *   favicon-32x32.png
 *   icon.png             – 32x32 (Next.js metadata icon)
 *   apple-touch-icon.png – 180x180
 *   icon-192.png         – Android PWA
 *   icon-512.png         – Android PWA splash
 *   manifest.json        – Updated with generated icon paths
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC_DIR, 'logo.png');

const SIZES = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'icon.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
];

async function generatePNGs() {
    for (const { name, size } of SIZES) {
        const dest = path.join(PUBLIC_DIR, name);
        await sharp(SOURCE)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(dest);
        console.log(`[Favicons] ✓ ${name} (${size}x${size})`);
    }
}

/**
 * Creates a minimal .ico file by wrapping a PNG buffer inside the ICO format.
 * Modern browsers (Chrome, Firefox, Edge, Safari) all support PNG-in-ICO.
 */
async function generateICO() {
    const dest = path.join(PUBLIC_DIR, 'favicon.ico');

    // Generate a 48x48 PNG buffer (ICO conventionally contains 48x48 as primary)
    const png32 = await sharp(SOURCE)
        .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

    // ICO format: wraps PNG data directly (ICO v4+ spec allows PNG images)
    const ICO_HEADER_SIZE = 6;
    const ICO_DIR_ENTRY_SIZE = 16;
    const imageDataOffset = ICO_HEADER_SIZE + ICO_DIR_ENTRY_SIZE;

    const ico = Buffer.alloc(imageDataOffset + png32.length);

    // ICO header
    ico.writeUInt16LE(0, 0);    // Reserved, must be 0
    ico.writeUInt16LE(1, 2);    // Type: 1 = ICO
    ico.writeUInt16LE(1, 4);    // Number of images

    // Directory entry for 32x32
    ico.writeUInt8(32, 6);               // Width (0 = 256)
    ico.writeUInt8(32, 7);               // Height
    ico.writeUInt8(0, 8);                // Color count (0 = no palette)
    ico.writeUInt8(0, 9);                // Reserved
    ico.writeUInt16LE(1, 10);            // Color planes
    ico.writeUInt16LE(32, 12);           // Bits per pixel
    ico.writeUInt32LE(png32.length, 14); // Size of image data
    ico.writeUInt32LE(imageDataOffset, 18); // Offset to image data

    // Image data
    png32.copy(ico, imageDataOffset);

    fs.writeFileSync(dest, ico);
    console.log(`[Favicons] ✓ favicon.ico (32x32 PNG-in-ICO)`);
}

async function updateManifest() {
    const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
    let manifest = {};
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch (e) { }

    manifest.icons = [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ];

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`[Favicons] ✓ manifest.json updated`);
}

async function run() {
    if (!fs.existsSync(SOURCE)) {
        console.error(`[Favicons] ✗ Source not found: ${SOURCE}`);
        console.error(`[Favicons]   Place your logo at public/logo.png and re-run.`);
        process.exit(1);
    }

    console.log(`[Favicons] Generating from ${SOURCE}...`);
    await generatePNGs();
    await generateICO();
    await updateManifest();
    console.log(`[Favicons] All done! ✨`);
}

run().catch(e => {
    console.error('[Favicons] Error:', e.message);
    process.exit(1);
});

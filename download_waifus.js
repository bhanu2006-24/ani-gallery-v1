const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMGS_DIR = path.join(__dirname, 'imgs');
const MAX_IMAGES = 50; // Safety limit, user can adjust
const MIN_DELAY = 2000;
const MAX_DELAY = 5000;

// Ensure local directory exists
if (!fs.existsSync(IMGS_DIR)) {
    fs.mkdirSync(IMGS_DIR);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url, sourceName) {
    try {
        // Skip GIFs immediately based on URL
        if (url.toLowerCase().endsWith('.gif')) {
            console.log(`  - Skipping GIF: ${url}`);
            return;
        }

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        let buffer = response.data;
        let extension = path.extname(url).split('?')[0] || '.jpg';
        if (extension === '.') extension = '.jpg';
        
        const sizeKb = buffer.length / 1024;
        const sizeMb = sizeKb / 1024;

        // 1. Skip if too small (junk/thumbnails/icons) - User mentioned 8kb is useless
        if (sizeKb < 50) {
            console.log(`  - Skipping too small image (${sizeKb.toFixed(2)}KB)`);
            return;
        }

        // 2. Skip GIFs if they slipped through URL check (check magic bytes or extension)
        // Simple check on extension again in case of redirects, though axios 'url' is the requested one.
        // We'll trust the extension for now, or sharp will fail/convert.
        if (extension.toLowerCase() === '.gif') {
            console.log(`  - Skipping GIF content`);
            return;
        }

        let wasCompressed = false;

        // 3. If larger than 1MB, resize and convert to optimized JPG
        if (sizeMb > 1) {
            console.log(`  > Image is large (${sizeMb.toFixed(2)}MB). Compressing...`);
            
            // Resize to max 1080px width (good for Shorts) and convert to optimized JPG
            buffer = await sharp(buffer)
                .resize({ width: 1080, withoutEnlargement: true })
                .jpeg({ quality: 85, mozjpeg: true })
                .toBuffer();
            
            extension = '.jpg';
            wasCompressed = true;
        }

        const timestamp = Date.now();
        const filename = `${sourceName}_${timestamp}${extension}`;
        const filePath = path.join(IMGS_DIR, filename);

        fs.writeFileSync(filePath, buffer);
        
        const finalSizeMb = buffer.length / (1024 * 1024);
        console.log(`  ✓ Saved: ${filename} (Size: ${finalSizeMb.toFixed(2)}MB${wasCompressed ? ', Compressed' : ''})`);

    } catch (error) {
        console.error(`  ✗ Error downloading from ${url}:`, error.message);
    }
}

async function getWaifuImUrl() {
    // waifu.im allows searching for PORTRAIT images (perfect for Shorts)
    try {
        const response = await axios.get('https://api.waifu.im/search?is_nsfw=false&orientation=PORTRAIT&gif=false');
        if (response.data.images && response.data.images.length > 0) {
            return response.data.images[0].url;
        }
    } catch (e) { console.error('Error fetching waifu.im API:', e.message); }
    return null;
}

async function getNekosBestUrl() {
    // nekos.best is high quality, often has mobile/portrait content too
    try {
        const response = await axios.get('https://nekos.best/api/v2/neko'); // Neko category
        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0].url;
        }
    } catch (e) { console.error('Error fetching nekos.best API:', e.message); }
    return null;
}

async function main() {
    console.log(`Starting download of ${MAX_IMAGES} images to ${IMGS_DIR}...`);
    console.log('Focusing on Portrait/Vertical images for YouTube Shorts where possible.');
    console.log('Press Ctrl+C to stop early.\n');

    for (let i = 0; i < MAX_IMAGES; i++) {
        // Alternate sources roughly, or randomize
        const isWaifuIm = Math.random() > 0.4; // Valid bias towards waifu.im for "Shorts" preference (portrait filter)
        let url = null;
        let source = 'waifu';

        if (isWaifuIm) {
            url = await getWaifuImUrl();
            source = 'waifu_im';
        } else {
            url = await getNekosBestUrl();
            source = 'neko_best';
        }

        if (url) {
            console.log(`[${i + 1}/${MAX_IMAGES}] Found URL: ${url}`);
            await downloadImage(url, source);
        } else {
            console.log(`[${i + 1}/${MAX_IMAGES}] Failed to fetch URL, skipping...`);
        }

        // Random delay 2-5 seconds
        const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);
        console.log(`Sleeping for ${delay / 1000}s...`);
        await sleep(delay);
    }
    console.log('Done!');
}

main();

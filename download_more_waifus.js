const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMGS_DIR = path.join(__dirname, 'imgs');
const MAX_IMAGES = 200;
const MIN_DELAY = 2000;
const MAX_DELAY = 5000;

if (!fs.existsSync(IMGS_DIR)) {
    fs.mkdirSync(IMGS_DIR);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url, sourceName) {
    if (!url) return;
    try {
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
        if (!extension || extension === '.') extension = '.jpg';
        
        const sizeKb = buffer.length / 1024;
        const sizeMb = sizeKb / 1024;

        if (sizeKb < 50) {
            console.log(`  - Skipping too small image (${sizeKb.toFixed(2)}KB)`);
            return;
        }
        
        // Final check for gif header if extension lied
        // GIF87a or GIF89a
        const header = buffer.toString('hex', 0, 4);
        if (header === '47494638') {
             console.log(`  - Skipping GIF content (header detected)`);
             return;
        }

        let wasCompressed = false;

        if (sizeMb > 1) {
            console.log(`  > Image is large (${sizeMb.toFixed(2)}MB). Compressing...`);
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
        console.log(`  ✓ Saved: ${filename} (Size: ${(buffer.length/1024/1024).toFixed(2)}MB${wasCompressed ? ', Compressed' : ''})`);

    } catch (error) {
        console.error(`  ✗ Error downloading from ${url}:`, error.message);
    }
}

async function getNekosLifeUrl() {
    // nekos.life
    // Endpoint: https://nekos.life/api/v2/img/neko
    try {
        const response = await axios.get('https://nekos.life/api/v2/img/neko');
        return response.data.url;
    } catch (e) { console.error('Error fetching nekos.life:', e.message); }
    return null;
}

async function getWaifuPicsUrl() {
    // waifu.pics
    // Endpoint: https://api.waifu.pics/sfw/waifu
    try {
        const response = await axios.get('https://api.waifu.pics/sfw/waifu');
        return response.data.url;
    } catch (e) { console.error('Error fetching waifu.pics:', e.message); }
    return null;
}

async function main() {
    console.log(`Starting download of ${MAX_IMAGES} images from Nekos.life and Waifu.pics...`);
    console.log('Images will be saved to:', IMGS_DIR);

    for (let i = 0; i < MAX_IMAGES; i++) {
        const isNekosLife = Math.random() > 0.5;
        let url = null;
        let source = 'unknown';

        if (isNekosLife) {
            url = await getNekosLifeUrl();
            source = 'nekos_life';
        } else {
            url = await getWaifuPicsUrl();
            source = 'waifu_pics';
        }

        if (url) {
            console.log(`[${i + 1}/${MAX_IMAGES}] Found URL (${source}): ${url}`);
            await downloadImage(url, source);
        } else {
            console.log(`[${i + 1}/${MAX_IMAGES}] Failed to fetch URL, skipping...`);
        }

        const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);
        console.log(`Sleeping for ${delay / 1000}s...`);
        await sleep(delay);
    }
    console.log('Done!');
}

main();

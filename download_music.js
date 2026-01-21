const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

// List of URLs to download
const videoUrls = [
    'https://youtu.be/XxliAKtHPTc?si=ZArYt8qZbeU84meG',
    'https://youtu.be/K4DyBUG242c?si=n3vzZ_K2DsBY6HSg',
    'https://youtu.be/3nQNiWdeH2Q?si=qNY2JvKvA9Db75Rz',
    // Add more URLs here as needed
];

// Add command line argument if provided
if (process.argv[2]) {
    videoUrls.push(process.argv[2]);
}

const outputDir = path.join(__dirname, 'music');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Helper to remove trash files created by ytdl
function cleanupTrash() {
    const cwd = __dirname;
    fs.readdir(cwd, (err, files) => {
        if (err) return;
        files.forEach(file => {
            // Remove the player-script.js files created by distube/ytdl-core
            if (file.endsWith('-player-script.js')) {
                fs.unlink(path.join(cwd, file), (err) => {
                   if (!err) console.log(`Deleted temp file: ${file}`);
                });
            }
        });
    });
}

async function downloadSingleVideo(url) {
    if (!ytdl.validateURL(url)) {
        console.error(`Invalid URL: ${url}`);
        return;
    }

    try {
        console.log(`Fetching info for: ${url}`);
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_'); 
        const outputPath = path.join(outputDir, `${title}.mp3`);

        if (fs.existsSync(outputPath)) {
            console.log(`  - File exists, skipping: ${title}`);
            return;
        }

        console.log(`  > Downloading: ${info.videoDetails.title}`);

        return new Promise((resolve, reject) => {
            ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })
                .pipe(fs.createWriteStream(outputPath))
                .on('finish', () => {
                    console.log(`  ✓ Saved to: ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`  ✗ Error downloading ${title}:`, err.message);
                    resolve(); // Resolve anyway to continue queue
                });
        });

    } catch (error) {
        console.error(`  ✗ Error processing ${url}:`, error.message);
    }
}

async function main() {
    console.log(`Starting download list (${videoUrls.length} items)...`);
    
    // Process sequentially
    for (const url of videoUrls) {
        await downloadSingleVideo(url);
    }
    
    console.log('\nAll downloads processed.');
    console.log('Cleaning up temporary files...');
    cleanupTrash();
}

main();

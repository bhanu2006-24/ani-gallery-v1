const fs = require('fs');
const path = require('path');


// List of URLs to download
const videoUrls = [
    'https://youtu.be/XxliAKtHPTc?si=ZArYt8qZbeU84meG',
    'https://youtu.be/K4DyBUG242c?si=n3vzZ_K2DsBY6HSg',
    'https://youtu.be/3nQNiWdeH2Q?si=qNY2JvKvA9Db75Rz',
    'https://youtu.be/LHvYrn3FAgI?si=BPbccb3jpA8g5J9k',
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

const youtubedl = require('youtube-dl-exec');

// ... (previous code)

async function downloadSingleVideo(url) {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        console.error(`Invalid URL: ${url}`);
        return;
    }

    try {
        console.log(`Processing: ${url}`);
        
        // Get Info first to get title
        const info = await youtubedl(url, {
             dumpSingleJson: true,
             noWarnings: true,
             noCheckCertificate: true,
        });

        const title = info.title.replace(/[^a-zA-Z0-9]/g, '_'); 
        const outputPath = path.join(outputDir, `${title}.mp3`);

        if (fs.existsSync(outputPath)) {
            console.log(`  - File exists, skipping: ${info.title}`);
            return;
        }

        console.log(`  > Downloading: ${info.title}`);

        // Download
        await youtubedl(url, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputPath,
            noCheckCertificate: true,
            // Add other options as needed
        });

        console.log(`  ✓ Saved to: ${outputPath}`);

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

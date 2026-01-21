const fs = require('fs');
const path = require('path');

const DIRECTORY = './imgs'; // Directory to rename files in
const PREFIX = 'img_';

if (!fs.existsSync(DIRECTORY)) {
    console.error(`Directory ${DIRECTORY} does not exist.`);
    process.exit(1);
}

fs.readdir(DIRECTORY, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Filter valid files (ignore hidden files, etc.)
    const validFiles = files.filter(file => !file.startsWith('.'));
    
    // Sort files to maintain some order (e.g., by creation time or name)
    // Here we sort alphabetical, but you could sort by fs.statSync(file).birthtime
    validFiles.sort();

    console.log(`Renaming ${validFiles.length} files in ${DIRECTORY}...`);

    let count = 1;
    validFiles.forEach(file => {
        const ext = path.extname(file);
        const oldPath = path.join(DIRECTORY, file);
        
        // Pad number with zeros: img_001.jpg
        const newName = `${PREFIX}${String(count).padStart(3, '0')}${ext}`;
        const newPath = path.join(DIRECTORY, newName);

        // Check if file already exists to avoid overwriting
        if (fs.existsSync(newPath) && oldPath !== newPath) {
             console.log(`Skipping reuse of ${newName}, file exists.`);
             // You might want slightly more complex logic here for safety
        } else {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed ${file} -> ${newName}`);
        }
        
        count++;
    });

    console.log('Renaming complete.');
});

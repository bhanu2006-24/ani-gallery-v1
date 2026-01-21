const fs = require('fs');
const path = require('path');

const IMGS_DIR = path.join(__dirname, 'imgs');
const OUTPUT_FILE = path.join(__dirname, 'index.html');

console.log('Generating static gallery...');

if (!fs.existsSync(IMGS_DIR)) {
    console.error('No imgs directory found!');
    process.exit(1);
}

const files = fs.readdirSync(IMGS_DIR).filter(file => !file.startsWith('.'));
const imageData = files.map(file => {
    try {
        const stats = fs.statSync(path.join(IMGS_DIR, file));
        return {
            name: file,
            path: `imgs/${file}`, // Relative path for static file
            size: stats.size,
            date: stats.mtime
        };
    } catch (e) { return null; }
}).filter(Boolean);

const totalSize = imageData.reduce((acc, img) => acc + img.size, 0);

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waifu Gallery</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --accent: #8b5cf6; }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }
        
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: var(--card); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
        .stat-val { font-size: 1.8rem; font-weight: 600; color: white; }
        .stat-label { color: #94a3b8; font-size: 0.9rem; }

        .controls { margin-bottom: 2rem; display: flex; gap: 1rem; background: var(--card); padding: 1rem; border-radius: 12px; align-items: center; }
        select { background: #334155; color: white; border: none; padding: 0.5rem; border-radius: 6px; }

        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .img-card { 
            background: var(--card); border-radius: 8px; overflow: hidden; 
            aspect-ratio: 2/3; position: relative; cursor: pointer; transition: transform 0.2s;
        }
        .img-card:hover { transform: scale(1.03); z-index: 10; box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
        .img-card img { width: 100%; height: 100%; object-fit: cover; }
        
        .info { 
            position: absolute; bottom: 0; left: 0; right: 0; 
            background: rgba(0,0,0,0.8); padding: 0.5rem; font-size: 0.8rem;
            transform: translateY(100%); transition: transform 0.3s;
        }
        .img-card:hover .info { transform: translateY(0); }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="stat-card">
            <div class="stat-label">Total Images</div>
            <div class="stat-val">${imageData.length}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Size</div>
            <div class="stat-val">${(totalSize/1024/1024).toFixed(2)} MB</div>
        </div>
    </div>

    <div class="controls">
        <label>Sort By:</label>
        <select id="sortBy" onchange="renderGallery()">
            <option value="name">Name</option>
            <option value="sizeDesc">Size (Largest)</option>
            <option value="sizeAsc">Size (Smallest)</option>
            <option value="newest">Newest</option>
        </select>
    </div>

    <div class="gallery" id="grid"></div>

    <script>
        // Embed data directly into the HTML
        const images = ${JSON.stringify(imageData)};

        function renderGallery() {
            const sort = document.getElementById('sortBy').value;
            const grid = document.getElementById('grid');
            
            const sorted = [...images].sort((a, b) => {
                if (sort === 'name') return a.name.localeCompare(b.name);
                if (sort === 'sizeDesc') return b.size - a.size;
                if (sort === 'sizeAsc') return a.size - b.size;
                if (sort === 'newest') return new Date(b.date) - new Date(a.date);
                return 0;
            });

            grid.innerHTML = sorted.map(img => \`
                <div class="img-card" onclick="window.open('\${img.path}', '_blank')">
                    <img src="\${img.path}" loading="lazy" alt="\${img.name}">
                    <div class="info">
                        <div>\${img.name}</div>
                        <div>\${(img.size/1024/1024).toFixed(2)} MB</div>
                    </div>
                </div>
            \`).join('');
        }

        renderGallery();
    </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, htmlContent);
console.log('Successfully created index.html');

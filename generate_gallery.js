const fs = require('fs');
const path = require('path');

const IMGS_DIR = path.join(__dirname, 'imgs');
const MUSIC_DIR = path.join(__dirname, 'music');
const OUTPUT_FILE = path.join(__dirname, 'index.html');
const API_FILE = path.join(__dirname, 'api.json'); // Renamed for clarity

// --- Configuration ---
// Change this url to your actual GitHub Pages URL
const HOSTED_URL = 'https://bhanu2006-24.github.io/ani-gallery-v1';

console.log('Generating static gallery with Tailwind...');

if (!fs.existsSync(IMGS_DIR)) {
    console.error('No imgs directory found!');
    process.exit(1);
}

// 1. Scan Images
console.log('Scanning images...');
const imgFiles = fs.readdirSync(IMGS_DIR).filter(file => !file.startsWith('.'));
const imageData = imgFiles.map(file => {
    try {
        const stats = fs.statSync(path.join(IMGS_DIR, file));
        return {
            name: file,
            path: `imgs/${file}`,
            size: stats.size,
            date: stats.mtime
        };
    } catch (e) { return null; }
}).filter(Boolean);

// 2. Scan Music
console.log('Scanning music...');
let musicData = [];
if (fs.existsSync(MUSIC_DIR)) {
    const musicFiles = fs.readdirSync(MUSIC_DIR).filter(file => !file.startsWith('.') && file.endsWith('.mp3'));
    musicData = musicFiles.map(file => {
        try {
            const stats = fs.statSync(path.join(MUSIC_DIR, file));
            return {
                name: file.replace(/_/g, ' ').replace('.mp3', ''),
                filename: file,
                path: `music/${file}`,
                size: stats.size
            };
        } catch (e) { return null; }
    }).filter(Boolean);
}

// 3. Generate API JSON (Combined)
const apiPayload = {
    generated_at: new Date().toISOString(),
    base_url: HOSTED_URL,
    total_images: imageData.length,
    total_music: musicData.length,
    images: imageData.map(img => ({
        name: img.name,
        url: `${HOSTED_URL}/${img.path}`,
        size: img.size
    })),
    music: musicData.map(track => ({
        title: track.name,
        url: `${HOSTED_URL}/${track.path}`,
        size: track.size
    }))
};

fs.writeFileSync(API_FILE, JSON.stringify(apiPayload, null, 2));
console.log('Created api.json');

// 4. Generate HTML
const totalSizeMB = ((imageData.reduce((a, b) => a + b.size, 0) + musicData.reduce((a, b) => a + b.size, 0)) / 1024 / 1024).toFixed(2);

const htmlContent = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AniGallery & API</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#8b5cf6',
                        dark: '#0f172a',
                        card: '#1e293b'
                    },
                    fontFamily: {
                        sans: ['Outfit', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Outfit', sans-serif; -webkit-tap-highlight-color: transparent; }
        .glass { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-dark text-slate-200 min-h-screen flex flex-col pb-safe">

    <!-- Responsive Navbar -->
    <nav class="sticky top-0 z-50 glass">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row items-center justify-between py-3 md:h-16 gap-3 md:gap-0">
                
                <!-- Top Row: Logo & Stats (Mobile) -->
                <div class="flex items-center justify-between w-full md:w-auto">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">A</div>
                        <span class="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">AniGallery</span>
                    </div>
                    <!-- Mobile Stats (Clean & Premium) -->
                    <div class="flex md:hidden items-center gap-3 text-[11px] font-medium bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-md shadow-sm">
                        <div class="flex items-center gap-1.5">
                            <span class="text-primary font-bold drop-shadow-sm">${imageData.length}</span>
                            <span class="text-slate-400">Imgs</span>
                        </div>
                        <div class="h-3 w-px bg-slate-700/80"></div>
                        <div class="flex items-center gap-1.5">
                             <span class="text-emerald-400 font-bold drop-shadow-sm">${musicData.length}</span>
                             <span class="text-slate-400">Tracks</span>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex w-full md:w-auto overflow-x-auto hide-scrollbar gap-1 bg-slate-800/50 p-1 rounded-xl md:rounded-full text-sm font-medium">
                    <button onclick="setTab('gallery')" id="tab-gallery" class="flex-1 md:flex-none px-4 py-1.5 rounded-lg md:rounded-full transition-all text-white bg-slate-700 shadow shadow-primary/20 text-center whitespace-nowrap">Gallery</button>
                    <button onclick="setTab('music')" id="tab-music" class="flex-1 md:flex-none px-4 py-1.5 rounded-lg md:rounded-full transition-all hover:text-white text-slate-400 text-center">Music</button>
                    <button onclick="setTab('docs')" id="tab-docs" class="flex-1 md:flex-none px-4 py-1.5 rounded-lg md:rounded-full transition-all hover:text-white text-slate-400 text-center">API Docs</button>
                </div>

                <!-- Desktop Stats -->
                <div class="hidden md:flex items-center gap-2">
                    <div class="text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        <span class="text-primary font-bold mr-1">${imageData.length}</span> Imgs
                        <span class="mx-2 text-slate-600">|</span>
                        <span class="text-emerald-400 font-bold mr-1">${musicData.length}</span> Tracks
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full">
        
        <!-- Gallery View -->
        <div id="view-gallery" class="space-y-4 md:space-y-6 animate-fade-in">
            <!-- Mobile-First Controls -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-card/50 p-3 md:p-4 rounded-xl border border-slate-700/50">
                <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                     <div class="relative w-full md:w-64">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input type="text" id="searchInput" placeholder="Search filename..." class="w-full bg-dark border border-slate-700 text-sm rounded-lg focus:border-primary focus:ring-1 focus:ring-primary pl-9 p-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-500">
                    </div>
                    <select id="sortSelect" onchange="renderGallery()" class="w-full md:w-48 bg-dark border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5 outline-none">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="sizeDesc">Size (High to Low)</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
                <div class="text-xs md:text-sm text-slate-400 font-mono w-full md:w-auto text-right">
                    Total: <span class="text-slate-200">${(imageData.reduce((a,b)=>a+b.size,0)/1024/1024).toFixed(2)} MB</span>
                </div>
            </div>

            <!-- Grid (2 cols mobile, 3+ desktop) -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4" id="gallery-grid">
                <!-- JS Injected -->
            </div>
             <div id="no-results" class="hidden text-center py-20 text-slate-500">
                <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
                <p>No images found matching your search</p>
            </div>
        </div>

        <!-- Music View -->
        <div id="view-music" class="hidden space-y-4 md:space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                ${musicData.map((track, i) => `
                <div class="bg-card hover:bg-slate-700/50 active:scale-[0.98] transition border border-slate-700/50 p-3 md:p-4 rounded-xl flex items-center gap-3 md:gap-4 group">
                    <div class="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/20 transition">
                        <i class="fa-solid fa-music text-white text-sm md:text-lg"></i>
                    </div>
                    <div class="flex-grow min-w-0">
                        <h3 class="font-medium text-slate-200 truncate cursor-help text-sm md:text-base" title="${track.name}">${track.name}</h3>
                        <p class="text-[10px] md:text-xs text-slate-400">${(track.size/1024/1024).toFixed(2)} MB • MP3</p>
                    </div>
                    <div class="flex gap-2">
                        <a href="${track.path}" download class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition">
                            <i class="fa-solid fa-download text-xs"></i>
                        </a>
                        <button onclick="playMusic('${track.path}', this)" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-white hover:text-dark transition">
                            <i class="fa-solid fa-play text-xs pl-0.5"></i>
                        </button>
                    </div>
                </div>
                `).join('')}
            </div>
            ${musicData.length === 0 ? '<div class="text-center py-20 text-slate-500">No music tracks found. Run node download_music.js</div>' : ''}
        </div>

        <!-- API Docs View -->
        <div id="view-docs" class="hidden max-w-4xl mx-auto space-y-6 md:space-y-8">
            <!-- Settings Toggle -->
            <div class="bg-card border border-slate-700 rounded-xl p-4 md:p-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                    <i class="fa-solid fa-database text-6xl md:text-9xl"></i>
                </div>
                <h2 class="text-xl md:text-2xl font-bold mb-4">API Configuration</h2>
                <div class="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
                    <span class="text-sm text-slate-400">Environment:</span>
                    <div class="flex bg-dark p-1 rounded-lg border border-slate-700 w-fit">
                        <button onclick="setEnv('hosted')" id="env-hosted" class="px-3 md:px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white transition">Hosted Public</button>
                        <button onclick="setEnv('local')" id="env-local" class="px-3 md:px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition">Localhost</button>
                    </div>
                </div>
                <div class="bg-dark rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm text-slate-300 border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 group">
                    <span id="api-url-display" class="break-all">${HOSTED_URL}/api.json</span>
                    <button onclick="navigator.clipboard.writeText(document.getElementById('api-url-display').innerText)" class="flex-shrink-0 text-xs bg-slate-700 px-3 py-1.5 rounded active:bg-primary transition w-full md:w-auto text-center">Copy URL</button>
                </div>
            </div>

            <div class="space-y-4 md:space-y-6">
                <h3 class="text-lg md:text-xl font-semibold border-b border-slate-700 pb-2">Endpoints</h3>
                
                <div class="space-y-4">
                    <div class="bg-card border border-slate-700 rounded-lg p-4">
                        <div class="flex items-center gap-3 mb-2">
                             <span class="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/20">GET</span>
                             <code class="text-sm font-mono text-slate-200">/api.json</code>
                        </div>
                        <p class="text-sm text-slate-400 mb-3">Returns comprehensive data for all images and music tracks.</p>
                        <div class="bg-dark rounded p-3 overflow-x-auto">
<pre class="text-[10px] md:text-xs text-blue-300 font-mono">
{
  "generated_at": "2024-...",
  "base_url": "...",
  "total_images": ${imageData.length},
  "images": [
    {
       "name": "img_001.jpg",
       "url": ".../imgs/img_001.jpg",
       "size": 240050
    }
  ],
  "music": [...]
}
</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800 bg-dark/50 py-6 mt-auto">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-slate-500 text-xs md:text-sm">Waifu Gallery v1.1 • Mobile Optimized</p>
        </div>
    </footer>

    <!-- Audio Player (Floating) -->
    <audio id="global-audio"></audio>

    <script>
        // Data Injected from Node
        const IMAGES = ${JSON.stringify(imageData)};
        const HOSTED_BASE = '${HOSTED_URL}';
        
        // State
        let currentTab = 'gallery';
        let currentEnv = localStorage.getItem('api_env') || 'hosted';

        // Init
        document.addEventListener('DOMContentLoaded', () => {
            renderGallery();
            setEnv(currentEnv);
            
            // Search Listener
            document.getElementById('searchInput').addEventListener('input', (e) => {
                renderGallery(e.target.value);
            });
        });

        // Tabs
        function setTab(tab) {
            document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
            document.getElementById('view-' + tab).classList.remove('hidden');
            
            // Update Buttons
            document.querySelectorAll('[id^="tab-"]').forEach(btn => {
                btn.className = 'flex-1 md:flex-none px-4 py-1.5 rounded-lg md:rounded-full transition-all hover:text-white text-slate-400 text-center';
            });
            const activeBtn = document.getElementById('tab-' + tab);
            activeBtn.className = 'flex-1 md:flex-none px-4 py-1.5 rounded-lg md:rounded-full transition-all text-white bg-slate-700 shadow shadow-primary/20 text-center whitespace-nowrap';
        }

        // Env Toggle
        function setEnv(env) {
            currentEnv = env;
            localStorage.setItem('api_env', env);
            
            const hostBtn = document.getElementById('env-hosted');
            const localBtn = document.getElementById('env-local');
            const urlDisplay = document.getElementById('api-url-display');

            if (env === 'hosted') {
                hostBtn.className = 'px-3 md:px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white transition shadow shadow-primary/20';
                localBtn.className = 'px-3 md:px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition';
                urlDisplay.innerText = HOSTED_BASE + '/api.json';
            } else {
                localBtn.className = 'px-3 md:px-4 py-1.5 text-xs font-medium rounded-md bg-emerald-500 text-white transition shadow shadow-emerald-500/20';
                hostBtn.className = 'px-3 md:px-4 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition';
                urlDisplay.innerText = 'http://localhost:3000/api.json (run local server)';
            }
        }

        // Gallery Render
        function renderGallery(filter = '') {
            const grid = document.getElementById('gallery-grid');
            const sort = document.getElementById('sortSelect').value;
            const noRes = document.getElementById('no-results');

            let filtered = IMAGES;
            if (filter) {
                const term = filter.toLowerCase();
                filtered = IMAGES.filter(img => img.name.toLowerCase().includes(term));
            }

            // Sort
            filtered.sort((a, b) => {
                if (sort === 'newest') return new Date(b.date) - new Date(a.date);
                if (sort === 'oldest') return new Date(a.date) - new Date(b.date);
                if (sort === 'sizeDesc') return b.size - a.size;
                if (sort === 'name') return a.name.localeCompare(b.name);
                return 0;
            });

            if (filtered.length === 0) {
                grid.innerHTML = '';
                noRes.classList.remove('hidden');
                return;
            }
            noRes.classList.add('hidden');

            const html = filtered.map((img, i) => \`
                <div class="group relative aspect-[2/3] bg-card rounded-lg overflow-hidden border border-slate-700/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10" onclick="window.open('\${img.path}', '_blank')">
                    <img src="\${img.path}" loading="lazy" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="\${img.name}">
                    <div class="absolute inset-0 bg-gradient-to-t from-dark/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 md:p-3">
                        <p class="text-[10px] md:text-xs font-mono text-white truncate">\${img.name}</p>
                        <p class="text-[9px] md:text-[10px] text-slate-400">\${(img.size/1024).toFixed(0)} KB</p>
                    </div>
                </div>
            \`).join('');

            grid.innerHTML = html;
        }

        // Music
        function playMusic(path, btn) {
            const audio = document.getElementById('global-audio');
            document.querySelectorAll('.fa-pause').forEach(i => i.classList.replace('fa-pause', 'fa-play'));
            if (audio.getAttribute('src') === path && !audio.paused) {
                audio.pause();
                return;
            }
            audio.src = path;
            audio.play();
            const icon = btn.querySelector('i');
            icon.classList.replace('fa-play', 'fa-pause');
            audio.onended = () => { icon.classList.replace('fa-pause', 'fa-play'); };
        }
    </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, htmlContent);
console.log('Successfully generated index.html with Premium UI & Music support.');


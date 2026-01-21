# 🌸 Waifu Gallery & API

A static, self-hosted anime image gallery and JSON API, curated for content creators.
All images are optimized for mobile/shorts (portrait orientation) and SFW.

## 🚀 Live Demo

- **Gallery**: [View Gallery](https://bhanu2006-24.github.io/ani-gallery-v1/)
- **Public API**: [images.json](https://bhanu2006-24.github.io/ani-gallery-v1/images.json)

## 📡 API Usage

You can use the `images.json` endpoint to get a list of all available images with direct hotlinks.

**Example Request:**

```bash
curl https://bhanu2006-24.github.io/ani-gallery-v1/images.json
```

**Response Format:**

```json
[
  {
    "name": "img_001.jpg",
    "url": "https://bhanu2006-24.github.io/ani-gallery-v1/imgs/img_001.jpg",
    "size": 245000,
    "date": "2024-03-20T10:00:00.000Z"
  },
  ...
]
```

## 🛠️ Scripts (For Maintainers)

This repo includes several utility scripts to manage the collection:

### 1. Download New Images

Downloads optimized SFW portrait images from `waifu.im`, `nekos.best`, `nekos.life`, and `waifu.pics`. Auto-skips GIFs and small images.

```bash
node download_waifus.js       # Source 1
node download_more_waifus.js  # Source 2
```

### 2. Rename & Organize

Sequentially renames all files in `imgs/` to `img_XXX.jpg` for clean ordering.

```bash
node rename_files.js
```

### 3. Generate Gallery & API

Scans the `imgs/` directory and regenerates the static `index.html` and `images.json` API file. **Run this after adding new images.**

```bash
node generate_gallery.js
```

### 4. Download Music

Downloads Copyright-Free music from YouTube for shorts.

```bash
node download_music.js [YOUTUBE_URL]
# Or edit the array in the file for batch downloading
```

## 📦 Installation

```bash
npm install
```

## 📄 License

Images belong to their respective creators/APIs. This project provides a curation tool.

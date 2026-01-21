const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size");

const directory = "./"; // Current directory
const supportedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".tiff",
  ".bmp",
];

// Helper to determine aspect ratio folder name
function getRatioFolder(width, height) {
  const ratio = width / height;

  // Define common ratios with some tolerance
  if (Math.abs(ratio - 1) < 0.05) return "1x1";

  if (Math.abs(ratio - 16 / 9) < 0.1) return "16x9";
  if (Math.abs(ratio - 9 / 16) < 0.1) return "9x16";

  if (Math.abs(ratio - 4 / 3) < 0.1) return "4x3";
  if (Math.abs(ratio - 3 / 4) < 0.1) return "3x4";

  if (Math.abs(ratio - 3 / 2) < 0.1) return "3x2";
  if (Math.abs(ratio - 2 / 3) < 0.1) return "2x3";

  if (Math.abs(ratio - 21 / 9) < 0.1) return "21x9";

  // Fallback for others
  if (ratio > 1) return "Other-Landscape";
  return "Other-Portrait";
}

function organizeImages() {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    let processedCount = 0;

    files.forEach((file) => {
      const ext = path.extname(file).toLowerCase();

      // Skip non-image files and the script itself
      if (!supportedExtensions.includes(ext) || file === "organize_imgs.js")
        return;

      const filePath = path.join(directory, file);

      try {
        const dimensions = sizeOf(filePath);
        const folderName = getRatioFolder(dimensions.width, dimensions.height);
        const targetDir = path.join(directory, folderName);

        // Create directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir);
        }

        // Move file
        const targetPath = path.join(targetDir, file);
        fs.renameSync(filePath, targetPath);

        console.log(`Moved ${file} to ${folderName}`);
        processedCount++;
      } catch (error) {
        console.error(`Skipping ${file}: Is it a valid image?`, error.message);
      }
    });

    console.log(`\nFinished! Organized ${processedCount} images.`);
  });
}

organizeImages();

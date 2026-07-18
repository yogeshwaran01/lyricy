const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Helper to copy file
function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${path.relative(__dirname, src)} to ${path.relative(__dirname, dest)}`);
}

// Copy manifest.json
copyFile(path.join(srcDir, 'manifest.json'), path.join(distDir, 'manifest.json'));

// Copy icons folder recursively if it exists
const srcIcons = path.join(srcDir, 'icons');
const distIcons = path.join(distDir, 'icons');
if (fs.existsSync(srcIcons)) {
  fs.mkdirSync(distIcons, { recursive: true });
  fs.readdirSync(srcIcons).forEach(file => {
    fs.copyFileSync(path.join(srcIcons, file), path.join(distIcons, file));
    console.log(`Copied icon ${file} to dist`);
  });
}

console.log('Asset copy completed.');

/**
 * Resizes assets/logo.png into favicons, extension icons, and social preview sizes.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const logoPath = path.join(rootDir, 'assets', 'logo.png');
const assetsDir = path.join(rootDir, 'assets');
const iconsDir = path.join(rootDir, 'extension', 'icons');

const outputs = [
  { file: path.join(assetsDir, 'favicon-16.png'), size: 16 },
  { file: path.join(assetsDir, 'favicon-32.png'), size: 32 },
  { file: path.join(assetsDir, 'apple-touch-icon.png'), size: 180 },
  { file: path.join(assetsDir, 'og-image.png'), size: 512 },
  { file: path.join(iconsDir, 'icon48.png'), size: 48 },
  { file: path.join(iconsDir, 'icon128.png'), size: 128 }
];

if (!fs.existsSync(logoPath)) {
  console.error('[icons] Missing assets/logo.png — add the project logo and rerun.');
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(iconsDir, { recursive: true });

const source = sharp(logoPath);

for (const { file, size } of outputs) {
  await source
    .clone()
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(file);
}

console.log('[icons] Generated favicons, og-image, and extension icons from assets/logo.png');

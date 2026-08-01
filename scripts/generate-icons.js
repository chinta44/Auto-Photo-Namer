import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import toIco from 'to-ico';

const inputPath = path.join(process.cwd(), 'src/assets/images/app_favicon_1785461153630.jpg');
const publicDir = path.join(process.cwd(), 'public');

async function generateAllIcons() {
  if (!fs.existsSync(inputPath)) {
    console.error('Source icon image not found:', inputPath);
    return;
  }

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating production icons from source image...');

  // 1. Generate PNG Buffers for ICO
  const buf16 = await sharp(inputPath).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(inputPath).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(inputPath).resize(48, 48).png().toBuffer();

  // 2. Build multi-resolution genuine ICO file
  const icoBuffer = await toIco([buf16, buf32, buf48]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // 3. Generate PNG favicons and touch icons
  await sharp(inputPath).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(inputPath).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(inputPath).resize(180, 180).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(inputPath).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(inputPath).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  await sharp(inputPath).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  await sharp(inputPath).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  await sharp(inputPath).resize(180, 180).jpeg({ quality: 90 }).toFile(path.join(publicDir, 'favicon.jpg'));

  console.log('Successfully generated clean binary ICO and PNG icons in /public!');
}

generateAllIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
});

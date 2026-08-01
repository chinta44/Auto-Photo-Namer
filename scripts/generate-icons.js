import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import toIco from 'to-ico';

const inputPath = path.join(process.cwd(), 'src/assets/images/app_favicon_1785461153630.jpg');
const publicDir = path.join(process.cwd(), 'public');

// Background color used behind the maskable icons (matches manifest.json theme_color/background_color)
const BG = { r: 2, g: 6, b: 23 };
// Fraction of the canvas the badge occupies inside a "maskable" icon (Android safe zone is the
// centered 80% circle; we stay a bit inside that for extra margin across launchers/shapes).
const MASKABLE_SAFE_RATIO = 0.72;

async function detectBadgeRadius(image, meta) {
  // Measure how far the circular badge extends from the image center before hitting the
  // black background, by sampling along the horizontal center row. This avoids hardcoding
  // pixel numbers that would break if the source image's resolution or crop ever changes.
  const { width, height } = meta;
  const cy = Math.floor(height / 2);
  const raw = await image
    .clone()
    .extract({ left: 0, top: cy, width, height: 1 })
    .raw()
    .toBuffer();

  const isNearBlack = (r, g, b) => r < 15 && g < 15 && b < 15;
  const channels = 3;

  let left = 0;
  for (let x = 0; x < Math.floor(width / 2); x++) {
    const i = x * channels;
    if (!isNearBlack(raw[i], raw[i + 1], raw[i + 2])) {
      left = x;
      break;
    }
  }

  let right = width - 1;
  for (let x = width - 1; x > Math.floor(width / 2); x--) {
    const i = x * channels;
    if (!isNearBlack(raw[i], raw[i + 1], raw[i + 2])) {
      right = x;
      break;
    }
  }

  const cx = width / 2;
  const radius = Math.min(cx - left, right - cx) - 2; // small inward margin for JPEG noise
  return { cx, cy: height / 2, radius: Math.max(radius, 1) };
}

function circleMaskSvg(size, cx, cy, r) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/></svg>`
  );
}

async function buildTransparentBadge(meta) {
  // Crop the source tightly to its circular badge and cut out everything outside the
  // circle as transparency, so the icon reads as a clean circle in browser tabs / app
  // drawers instead of a black square.
  const { cx, cy, radius } = await detectBadgeRadius(sharp(inputPath), meta);
  const left = Math.round(cx - radius);
  const top = Math.round(cy - radius);
  const side = Math.round(radius * 2);

  const mask = circleMaskSvg(side, side / 2, side / 2, side / 2);

  return sharp(inputPath)
    .extract({ left, top, width: side, height: side })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png();
}

async function generateAllIcons() {
  if (!fs.existsSync(inputPath)) {
    console.error('Source icon image not found:', inputPath);
    return;
  }
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating production icons from source image...');

  const meta = await sharp(inputPath).metadata();
  const badge = await buildTransparentBadge(meta);
  const badgeBuffer = await badge.clone().toBuffer();

  // 1. favicon.ico (multi-resolution, transparent circle)
  const buf16 = await sharp(badgeBuffer).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(badgeBuffer).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(badgeBuffer).resize(48, 48).png().toBuffer();
  const icoBuffer = await toIco([buf16, buf32, buf48]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  // 2. Transparent circular PNGs (browser tab / "any" purpose)
  await sharp(badgeBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(badgeBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(badgeBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(badgeBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  await sharp(badgeBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));

  // 3. Apple touch icons: opaque square, no transparency (iOS fills transparency with black otherwise)
  await sharp(inputPath).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(inputPath).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon-precomposed.png'));
  await sharp(inputPath).resize(180, 180).jpeg({ quality: 90 }).toFile(path.join(publicDir, 'favicon.jpg'));

  // 4. Maskable icons: opaque background + badge shrunk into the safe zone so Android's
  // adaptive-icon mask (circle / squircle / teardrop) never clips the artwork.
  async function makeMaskable(size) {
    const target = Math.round(size * MASKABLE_SAFE_RATIO);
    const resizedBadge = await sharp(badgeBuffer).resize(target, target).toBuffer();
    return sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: BG,
      },
    })
      .composite([{ input: resizedBadge, gravity: 'center' }])
      .png()
      .toFile(path.join(publicDir, `android-chrome-${size}x${size}-maskable.png`));
  }
  await makeMaskable(192);
  await makeMaskable(512);

  console.log('Successfully generated clean binary ICO and PNG icons in /public!');
}

generateAllIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});

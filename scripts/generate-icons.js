// Generate PWA icons by cropping the cauris (cowrie shell) from the HOXA logo
// Makes all backgrounds transparent, except maskable icons (green bg)
// Run: node scripts/generate-icons.js

const path = require('path');
const sharp = require('sharp');

// Remove white/near-white pixels → transparent
async function removeWhiteBg(inputBuffer, threshold = 240) {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      pixels[i + 3] = 0; // make transparent
    }
  }

  return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function main() {
  const logoPath = path.join(__dirname, '..', 'hoxa-logo.jpeg');
  const outDir = path.join(__dirname, '..', 'public', 'icons');

  const meta = await sharp(logoPath).metadata();
  console.log(`Logo: ${meta.width}x${meta.height}`);

  // --- Full logo with transparent background ---
  const logoPngBuf = await sharp(logoPath).png().toBuffer();
  const logoTransparent = await removeWhiteBg(logoPngBuf);
  await sharp(logoTransparent).toFile(path.join(outDir, '..', 'hoxa-logo.png'));
  console.log('  ✓ public/hoxa-logo.png (full logo, transparent)');

  // --- Crop the cauris (cowrie shell "O") ---
  const caurisCenter = { x: 595, y: 245 };
  const caurisRadius = 185;
  const cropSize = caurisRadius * 2 + 20;
  const left = Math.max(0, Math.round(caurisCenter.x - cropSize / 2));
  const top = Math.max(0, Math.round(caurisCenter.y - cropSize / 2));

  console.log(`Cropping cauris: left=${left}, top=${top}, size=${cropSize}`);

  const caurisCropped = await sharp(logoPath)
    .extract({ left, top, width: cropSize, height: Math.min(cropSize, meta.height - top) })
    .png()
    .toBuffer();

  const croppedMeta = await sharp(caurisCropped).metadata();
  console.log(`Cropped: ${croppedMeta.width}x${croppedMeta.height}`);

  // Make square with transparent padding
  const squareSize = Math.max(croppedMeta.width, croppedMeta.height);
  const caurisSquare = await sharp(caurisCropped)
    .resize(squareSize, squareSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  // Remove white background from the cauris
  const caurisTransparent = await removeWhiteBg(caurisSquare);

  // --- Regular icons (transparent background) ---
  const sizes = [32, 180, 192, 512];
  for (const size of sizes) {
    const resized = await sharp(caurisTransparent)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    if (size === 32) {
      await sharp(resized).toFile(path.join(outDir, 'favicon-32.png'));
      console.log('  ✓ favicon-32.png (transparent)');
    }
    if (size === 180) {
      await sharp(resized).toFile(path.join(outDir, 'apple-touch-icon.png'));
      console.log('  ✓ apple-touch-icon.png (transparent)');
    }
    if (size === 192 || size === 512) {
      await sharp(resized).toFile(path.join(outDir, `icon-${size}.png`));
      console.log(`  ✓ icon-${size}.png (transparent)`);
    }
  }

  // --- Maskable icons (green background, needed for PWA) ---
  for (const size of [192, 512]) {
    const innerSize = Math.round(size * 0.6);
    const padding = Math.round((size - innerSize) / 2);

    const inner = await sharp(caurisTransparent)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 24, g: 130, b: 74, alpha: 255 } }
    })
      .composite([{ input: inner, left: padding, top: padding }])
      .png()
      .toFile(path.join(outDir, `icon-maskable-${size}.png`));

    console.log(`  ✓ icon-maskable-${size}.png (green bg)`);
  }

  // --- White version of full logo (for dark backgrounds) ---
  // Make all non-transparent pixels white
  const logoTransBuf = await sharp(logoTransparent).raw().toBuffer({ resolveWithObject: true });
  const whitePixels = Buffer.from(logoTransBuf.data);
  for (let i = 0; i < whitePixels.length; i += 4) {
    if (whitePixels[i + 3] > 0) { // if not transparent
      whitePixels[i] = 255;     // R
      whitePixels[i + 1] = 255; // G
      whitePixels[i + 2] = 255; // B
    }
  }
  await sharp(whitePixels, { raw: { width: logoTransBuf.info.width, height: logoTransBuf.info.height, channels: 4 } })
    .png()
    .toFile(path.join(outDir, '..', 'hoxa-logo-white.png'));
  console.log('  ✓ public/hoxa-logo-white.png (white on transparent)');

  console.log('\nAll icons generated with transparent backgrounds!');
}

main().catch(console.error);

// Generate PWA icons by cropping the cauris (cowrie shell) from the HOXA logo
// Run: node scripts/generate-icons.js

const path = require('path');
const sharp = require('sharp');

async function main() {
  const logoPath = path.join(__dirname, '..', 'hoxa-logo.jpeg');
  const outDir = path.join(__dirname, '..', 'public', 'icons');

  // Get logo dimensions
  const meta = await sharp(logoPath).metadata();
  console.log(`Logo: ${meta.width}x${meta.height}`);

  // The cauris (cowrie shell "O") is roughly centered in the logo
  // Logo is 1500x491, the cauris circle spans roughly x:430-710, y:45-440
  // We want a square crop centered on the cauris
  const caurisCenter = { x: 595, y: 245 };
  const caurisRadius = 185; // half the shell circle diameter
  const cropSize = caurisRadius * 2 + 20; // add small padding

  const left = Math.max(0, Math.round(caurisCenter.x - cropSize / 2));
  const top = Math.max(0, Math.round(caurisCenter.y - cropSize / 2));

  console.log(`Cropping cauris: left=${left}, top=${top}, size=${cropSize}`);

  // Crop the cauris from logo
  const caurisCropped = await sharp(logoPath)
    .extract({ left, top, width: cropSize, height: Math.min(cropSize, meta.height - top) })
    .toBuffer();

  // Check what we got
  const croppedMeta = await sharp(caurisCropped).metadata();
  console.log(`Cropped: ${croppedMeta.width}x${croppedMeta.height}`);

  // Make it perfectly square (pad if needed) with white background
  const squareSize = Math.max(croppedMeta.width, croppedMeta.height);
  const caurisSquare = await sharp(caurisCropped)
    .resize(squareSize, squareSize, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .toBuffer();

  // Generate regular icons (white background, rounded corners applied by OS)
  const sizes = [32, 180, 192, 512];
  for (const size of sizes) {
    const resized = await sharp(caurisSquare)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .png()
      .toBuffer();

    if (size === 32) {
      await sharp(resized).toFile(path.join(outDir, 'favicon-32.png'));
      console.log('  ✓ favicon-32.png');
    }
    if (size === 180) {
      await sharp(resized).toFile(path.join(outDir, 'apple-touch-icon.png'));
      console.log('  ✓ apple-touch-icon.png');
    }
    if (size === 192 || size === 512) {
      await sharp(resized).toFile(path.join(outDir, `icon-${size}.png`));
      console.log(`  ✓ icon-${size}.png`);
    }
  }

  // Generate maskable icons (with HOXA green background + padding for safe zone)
  for (const size of [192, 512]) {
    // Maskable icons need 20% padding (safe zone) with brand background
    const innerSize = Math.round(size * 0.6); // 60% of total = content area
    const padding = Math.round((size - innerSize) / 2);

    const inner = await sharp(caurisSquare)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    // Create green background and composite the cauris on top
    const maskable = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 24, g: 130, b: 74, alpha: 255 } // #18824a
      }
    })
      .composite([{ input: inner, left: padding, top: padding }])
      .png()
      .toFile(path.join(outDir, `icon-maskable-${size}.png`));

    console.log(`  ✓ icon-maskable-${size}.png`);
  }

  // Also save the full logo for use in headers/splash
  await sharp(logoPath)
    .png()
    .toFile(path.join(outDir, '..', 'hoxa-logo.png'));
  console.log('  ✓ public/hoxa-logo.png (full logo)');

  console.log('\nAll icons generated from cauris logo!');
}

main().catch(console.error);

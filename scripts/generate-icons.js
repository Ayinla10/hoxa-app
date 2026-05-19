// Generate PWA icons using sharp (bundled with Next.js)
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

function createSVG(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.2) : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const letterSize = Math.round(innerSize * 0.45);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${maskable ? '#18824a' : 'none'}" rx="${maskable ? 0 : Math.round(size * 0.18)}"/>
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${Math.round(innerSize * 0.18)}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18824a"/>
      <stop offset="100%" stop-color="#0f5530"/>
    </linearGradient>
  </defs>
  <text x="${cx}" y="${cy}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${letterSize}" fill="white" text-anchor="middle" dominant-baseline="central">H</text>
</svg>`;
}

async function main() {
  // Try to load sharp from Next.js's dependency
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    try {
      sharp = require(require.resolve('sharp', { paths: [path.join(__dirname, '..', 'node_modules', 'next')] }));
    } catch {
      console.error('sharp not found. Install it: npm install sharp');
      process.exit(1);
    }
  }

  const outDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const sizes = [192, 512];

  for (const size of sizes) {
    // Regular icon
    const svg = Buffer.from(createSVG(size, false));
    await sharp(svg).png().toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`  ✓ icon-${size}.png`);

    // Maskable icon
    const maskSvg = Buffer.from(createSVG(size, true));
    await sharp(maskSvg).png().toFile(path.join(outDir, `icon-maskable-${size}.png`));
    console.log(`  ✓ icon-maskable-${size}.png`);
  }

  // Also generate apple-touch-icon (180x180)
  const appleSvg = Buffer.from(createSVG(180, false));
  await sharp(appleSvg).png().toFile(path.join(outDir, `apple-touch-icon.png`));
  console.log(`  ✓ apple-touch-icon.png`);

  // Generate favicon (32x32)
  const favSvg = Buffer.from(createSVG(32, false));
  await sharp(favSvg).png().toFile(path.join(outDir, `favicon-32.png`));
  console.log(`  ✓ favicon-32.png`);

  console.log('\nAll PNG icons generated in public/icons/');
}

main().catch(console.error);

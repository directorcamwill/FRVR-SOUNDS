// Generate PWA icons from an inline SVG of the FRVR SOUNDS brand mark.
// Outputs to public/icons/*.png. Safe to re-run.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const ACCENT = "#DC2626";
const BG = "#050505";

function svg(size, { maskable = false } = {}) {
  const pad = maskable ? size * 0.18 : size * 0.08;
  const r = maskable ? 0 : size * 0.2;
  const inner = size - pad * 2;
  const fontSize = inner * 0.42;
  const subFontSize = inner * 0.14;
  const subY = pad + inner * 0.78;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="30%" cy="20%" r="90%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="${BG}"/>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <text x="50%" y="${pad + inner * 0.52}" text-anchor="middle" dominant-baseline="middle"
    font-family="Playfair Display, Georgia, serif" font-weight="900" font-size="${fontSize}" fill="${ACCENT}"
    letter-spacing="${inner * 0.01}">FRVR</text>
  <text x="50%" y="${subY}" text-anchor="middle" dominant-baseline="middle"
    font-family="Inter, Helvetica, Arial, sans-serif" font-weight="600" font-size="${subFontSize}" fill="#ffffff"
    letter-spacing="${inner * 0.045}">SOUNDS</text>
</svg>`;
}

async function render(size, outPath, opts = {}) {
  const buf = Buffer.from(svg(size, opts));
  await sharp(buf).png().toFile(outPath);
  console.log(`  ${outPath} (${size}x${size}${opts.maskable ? ", maskable" : ""})`);
}

await mkdir("public/icons", { recursive: true });

console.log("Generating PWA icons:");
await render(192, "public/icons/icon-192.png");
await render(512, "public/icons/icon-512.png");
await render(512, "public/icons/icon-maskable-512.png", { maskable: true });
await render(180, "public/icons/apple-touch-icon.png");

// Also emit a raw SVG for any consumer that can use it.
await writeFile("public/icons/icon.svg", svg(512));
console.log("  public/icons/icon.svg");

console.log("Done.");

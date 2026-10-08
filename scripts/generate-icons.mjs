#!/usr/bin/env node
// generate-icons.mjs — derive EVERY raster logo from the one canonical logo
// file: src/app/icon.svg (the exact mark drawn in the navbar).
//
// Run after changing icon.svg:   node scripts/generate-icons.mjs
//
// Outputs:
//   src/app/apple-icon.png                  180   opaque ink background
//   src/app/favicon.ico                     16/32/48 (PNG-in-ICO), ink
//   mobile/assets/images/icon.png           1024  app icon, ink
//   mobile/assets/images/splash-icon.png    228   transparent (splash + animated icon)
//   mobile/assets/images/favicon.png        48    ink
//   mobile/assets/images/android-icon-foreground.png 1024 transparent
//   mobile/assets/images/android-icon-monochrome.png 1024 white silhouette
//
// Sizing notes:
//   - scale is a zoom of the mark inside the 32-unit viewBox (1 = as drawn
//     in the navbar). The artwork is not centred in the viewBox, so scales
//     are tuned per platform to compensate.
//   - The Android foreground stays inside the 66/108dp adaptive-icon safe
//     circle so no launcher shape (circle, squircle) can clip the sun.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL = path.join(ROOT, "src", "app", "icon.svg");
const INK = "#2C2825";

// ---------------------------------------------------- canonical content ---
const raw = fs.readFileSync(CANONICAL, "utf8");
const inner = raw
  .replace(/<\?xml[^>]*\?>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "") // strip the doc comment
  .replace(/^\s*<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .trim();

// Sanity check: refuse to generate icons from the wrong file (e.g. if the
// navbar path was edited but icon.svg was replaced by something else).
if (!inner.includes("M23 7c")) {
  console.error("icon.svg does not contain the navbar leaf mark — aborting.");
  process.exit(1);
}

/**
 * Compose a render-ready SVG from the canonical artwork.
 * @param {object} o
 * @param {number} o.size   output width/height in px (canvas is square)
 * @param {number} [o.scale] zoom of the mark (1 = exactly as in the navbar)
 * @param {"ink"|"none"} [o.bg] "ink" = opaque brand background
 * @param {boolean} [o.white] recolour every fill to #FFFFFF (monochrome layer)
 */
function compose({ size, scale = 1, bg = "none", white = false }) {
  let art = inner;
  if (white) art = art.replace(/fill="[^"]*"/g, 'fill="#FFFFFF"');
  const offset = 16 * (1 - scale); // keep the viewBox centre (16,16) fixed
  const background =
    bg === "ink" ? `<rect width="32" height="32" fill="${INK}"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">` +
    `${background}` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})">${art}</g>` +
    `</svg>`
  );
}

async function render(relPath, opts) {
  const svg = compose(opts);
  await sharp(Buffer.from(svg)).png().toFile(path.join(ROOT, relPath));
  const note = opts.white ? " white silhouette" : ` bg=${opts.bg ?? "none"}`;
  console.log(`  ${relPath}  ${opts.size}x${opts.size}${note}  scale=${opts.scale}`);
}

// ----------------------------------------------------------- favicon.ico ---
// ICO supports embedded PNGs (Vista+); wrap the rendered PNGs by hand since
// sharp cannot write the .ico container itself.
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dirEntries = [];
  for (const { size, data } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dirEntries.push(e);
  }
  return Buffer.concat([header, ...dirEntries, ...entries.map((e) => e.data)]);
}

async function renderIco(relPath, sizes, opts) {
  const entries = [];
  for (const size of sizes) {
    const png = await sharp(Buffer.from(compose({ ...opts, size })))
      .png()
      .toBuffer();
    entries.push({ size, data: png });
  }
  fs.writeFileSync(path.join(ROOT, relPath), buildIco(entries));
  console.log(`  ${relPath}  ${sizes.join("/")}  bg=${opts.bg}  scale=${opts.scale}`);
}

// ------------------------------------------------------------------ main ---
console.log("Generating rasters from src/app/icon.svg ...");

await render("src/app/apple-icon.png", { size: 180, scale: 1.17, bg: "ink" });
await renderIco("src/app/favicon.ico", [16, 32, 48], { scale: 1.15, bg: "ink" });

await render("mobile/assets/images/icon.png", { size: 1024, scale: 1.32, bg: "ink" });
await render("mobile/assets/images/splash-icon.png", { size: 228, scale: 1.45 });
await render("mobile/assets/images/favicon.png", { size: 48, scale: 1.15, bg: "ink" });
await render("mobile/assets/images/android-icon-foreground.png", {
  size: 1024,
  scale: 0.77,
});
await render("mobile/assets/images/android-icon-monochrome.png", {
  size: 1024,
  scale: 0.77,
  white: true,
});

// The adaptive-icon BACKGROUND layer must stay a plain fill — the mark lives
// in the foreground layer. Only rewrite it if it currently carries artwork.
const bgPath = path.join(ROOT, "mobile/assets/images/android-icon-background.png");
const stats = await sharp(bgPath).stats();
const isPlain = stats.channels.every((c) => c.stdev < 1);
if (isPlain) {
  console.log("  mobile/assets/images/android-icon-background.png  plain fill — left untouched");
} else {
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: INK },
  })
    .png()
    .toFile(bgPath);
  console.log("  mobile/assets/images/android-icon-background.png  replaced non-plain layer with ink fill");
}

console.log("Done.");

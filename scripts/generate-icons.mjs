// Generates the PWA icons from assets/app-icon.svg (ARCHITECTURE.md, section 2.12)
// Run once with `npm run icons`; the PNGs are committed to the repository.
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = await readFile(new URL("../assets/app-icon.svg", import.meta.url), "utf8");
const outDir = new URL("../public/icons/", import.meta.url);
await mkdir(outDir, { recursive: true });

// fraction = share of the icon width taken by the emblem (64 units wide)
const icons = [
  { name: "icon-192.png", size: 192, fraction: 0.84 },
  { name: "icon-512.png", size: 512, fraction: 0.84 },
  // Maskable: keep the emblem inside the 80% safe zone
  { name: "icon-maskable-512.png", size: 512, fraction: 0.64 },
  { name: "apple-touch-icon.png", size: 180, fraction: 0.78 },
];

for (const { name, size, fraction } of icons) {
  const scale = ((512 * fraction) / 64).toFixed(3);
  const svg = source.replace("{{SCALE}}", scale);
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, outDir)));
  console.log(`Created public/icons/${name}`);
}

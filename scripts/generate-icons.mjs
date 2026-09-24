// Generates PWA PNG icons from SVG sources using sharp.
// Run: npm run generate-icons
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const { default: sharp } = await import("sharp");

const jobs = [
  { src: join(root, "public", "favicon.svg"), file: "icon-192.png", size: 192 },
  { src: join(root, "public", "favicon.svg"), file: "icon-512.png", size: 512 },
  { src: join(root, "scripts", "icon-maskable-source.svg"), file: "maskable-512.png", size: 512 },
  { src: join(root, "public", "favicon.svg"), file: "apple-180.png", size: 180 },
];

for (const { src, file, size } of jobs) {
  if (!existsSync(src)) throw new Error(`Missing source: ${src}`);
  const svg = readFileSync(src);
  await sharp(svg).resize(size, size).png().toFile(join(outDir, file));
  console.log(`wrote public/icons/${file} (${size}x${size})`);
}

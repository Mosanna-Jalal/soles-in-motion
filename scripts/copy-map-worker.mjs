// Copies MapLibre's web worker into /public so the map can load it from our own origin.
// Runs on `npm install` (postinstall); the output is git-ignored.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const dest = join(root, "public/vendor/maplibre-gl-worker.mjs");

try {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log("[map] worker copied to public/vendor/");
} catch (err) {
  console.warn("[map] could not copy MapLibre worker:", err.message);
}

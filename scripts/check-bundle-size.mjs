#!/usr/bin/env node
/**
 * Fails (exit 1) if any production bundle asset exceeds its gzip size budget.
 * Vite's own build already warns past 500KB raw, but that warning is just text
 * scrolling past in a build log that nothing acts on -- this is what actually
 * stops it from being ignored. Run after `npm run build` (reads dist/assets).
 *
 * Budgets are gzip, not raw size, because gzip is what actually gets sent over
 * the network and is what the warning this replaces was really about -- raw
 * minified size overstates the real cost by roughly 3-4x for JS like this.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(dirname, "..", "dist", "assets");

// ~10-15% above the measured size when this check was added (main JS: 379KB gzip,
// worker: 140KB gzip, css: 14KB gzip) -- tight enough to catch a real regression,
// loose enough not to block normal iteration. Bump deliberately, with a reason in the
// commit message, if a real feature genuinely needs more; don't bump it just to make a
// failure go away.
const BUDGETS_KB = [
  { pattern: /^index-.*\.js$/, label: "main JS bundle", budgetKb: 420 },
  { pattern: /^maplibre-gl-worker-.*\.js$/, label: "MapLibre worker chunk", budgetKb: 160 },
  { pattern: /^index-.*\.css$/, label: "main CSS bundle", budgetKb: 20 },
];

function gzipKb(filePath) {
  return zlib.gzipSync(fs.readFileSync(filePath)).length / 1024;
}

if (!fs.existsSync(ASSETS_DIR)) {
  console.error(`::error::${ASSETS_DIR} not found -- run \`npm run build\` first.`);
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
let failed = false;

for (const { pattern, label, budgetKb } of BUDGETS_KB) {
  const match = files.find((f) => pattern.test(f));
  if (!match) {
    console.warn(`No file matching ${pattern} in dist/assets for "${label}" -- skipping (build output shape may have changed).`);
    continue;
  }
  const actualKb = gzipKb(path.join(ASSETS_DIR, match));
  const overBudget = actualKb > budgetKb;
  console.log(`${overBudget ? "::error::" : ""}${label} (${match}): ${actualKb.toFixed(1)} KB gzip, budget ${budgetKb} KB${overBudget ? " -- OVER BUDGET" : ""}`);
  if (overBudget) failed = true;
}

if (failed) {
  console.error("::error::One or more bundle assets exceeded their size budget -- see above.");
  process.exit(1);
}

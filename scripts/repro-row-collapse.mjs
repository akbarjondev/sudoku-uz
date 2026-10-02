// Differential repro for the collapsed empty middle row.
// Fixture: 81 real `.cell` buttons, row 5 (index 4) fully empty like the
// user's screenshot. Measures each row's rendered height at iPhone width.
//  - OLD css (grid-template-rows stripped, = deployed build) -> RED
//  - NEW css (current src/styles/board.css) -> GREEN
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = process.cwd();
const tokens = fs.readFileSync("src/styles/tokens.css", "utf8");
const base = fs.readFileSync("src/styles/base.css", "utf8");
let board = fs.readFileSync("src/styles/board.css", "utf8");
const boardOld = board.replace(/^\s*grid-template-rows:[^;]+;\s*$/m, "/* stripped: deployed build */");

function fixture(cssText) {
  let cells = "";
  for (let i = 0; i < 81; i++) {
    const row = (i / 9) | 0;
    const val = row === 4 ? "" : ((i % 9) + 1); // row 5 empty, like screenshot
    cells += `<button class="cell">${val}</button>`;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${tokens}\n${base}\n${cssText}</style></head>
<body><main class="wrap"><div class="board">${cells}</div></main></body></html>`;
}

const EXE =
  `${os.homedir()}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;

const browser = await chromium.launch({ executablePath: EXE });
let failed = false;
for (const [name, css] of [["OLD (deployed)", boardOld], ["NEW (fixed)", board]]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sudoku-repro-"));
  const file = path.join(dir, "board.html");
  fs.writeFileSync(file, fixture(css));
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto("file://" + file);
  const heights = await page.$$eval(".cell", (els) =>
    els.filter((_, i) => i % 9 === 0).map((el) => el.getBoundingClientRect().height)
  );
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const mid = heights[4];
  const ok = max - min <= 1 && mid >= min;
  console.log(`${ok ? "PASS" : "FAIL"}: ${name} rows=[${heights.map((h) => h.toFixed(1)).join(", ")}]`);
  if (name.startsWith("OLD") && ok) { console.log("  expected OLD to be RED"); failed = true; }
  if (name.startsWith("NEW") && !ok) { console.log("  expected NEW to be GREEN"); failed = true; }
  await page.context().close();
  fs.rmSync(dir, { recursive: true, force: true });
}
await browser.close();
if (failed) { console.log("RED: repro expectations not met"); process.exit(1); }
console.log("GREEN: old collapses, fixed renders 9 equal rows");

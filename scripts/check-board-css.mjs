import fs from "node:fs";
const css = fs.readFileSync("src/styles/board.css", "utf8");
const failures = [];
function check(name, re) {
  const ok = re.test(css);
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failures.push(name);
}
// 1. Grid must define equal rows, not rely on aspect-ratio + auto rows
check("board has grid-template-rows: repeat(9, 1fr)", /grid-template-rows\s*:\s*repeat\s*\(\s*9\s*,\s*1fr\s*\)/);
// 2. iOS buttons need appearance reset (otherwise Safari adds native styling)
check("cell resets iOS native button appearance", /-webkit-appearance\s*:\s*none|appearance\s*:\s*none/);
// 3. Cells must not collapse when empty (min-height / aspect handling)
check("cell prevents collapse on empty content", /min-height\s*:\s*0/);
if (failures.length) {
  console.log(`\nRED: ${failures.length} board CSS invariant(s) broken -> iPhone row glitch likely`);
  process.exit(1);
} else {
  console.log("\nGREEN: board CSS invariants hold");
}

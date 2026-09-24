import { generate, peersOf } from "./sudoku.js";

const SAVE_KEY = "sudoku-save-v1";
const BEST_KEY = "sudoku-best-v1";
export const MAX_MISTAKES = 3;
export const MAX_HINTS = 3;

export function emptyNotes() {
  return Array.from({ length: 81 }, () => new Set());
}

export function createGame(difficulty = "easy", puzzle = null, solution = null) {
  let gen = puzzle && solution ? { puzzle, solution } : generate(difficulty);
  return {
    difficulty,
    puzzle: gen.puzzle.slice(),
    solution: gen.solution.slice(),
    current: gen.puzzle.slice(),
    notes: emptyNotes(),
    locked: gen.puzzle.map((v) => v !== 0),
    selected: -1,
    notesMode: false,
    mistakes: 0,
    hints: MAX_HINTS,
    seconds: 0,
    status: "playing", // playing | paused | won | lost
    startedAt: Date.now(),
  };
}

// Serialize notes Sets for storage
export function save(game) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        ...game,
        notes: game.notes.map((s) => [...s]),
      })
    );
  } catch { /* ignore */ }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw);
    g.notes = g.notes.map((a) => new Set(a));
    return g;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* ignore */ }
}

export function getBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setBest(diff, seconds) {
  try {
    const b = getBest();
    if (!b[diff] || seconds < b[diff]) {
      b[diff] = seconds;
      localStorage.setItem(BEST_KEY, JSON.stringify(b));
    }
    return b;
  } catch {
    return {};
  }
}

// Remove a placed number from peers' notes (auto-clean)
function cleanPeerNotes(game, idx, val) {
  for (const p of peersOf(idx)) {
    if (game.notes[p].has(val)) game.notes[p].delete(val);
  }
}

export function place(game, idx, val) {
  if (game.status !== "playing" || idx < 0 || game.locked[idx]) return { ok: false };
  if (game.notesMode) {
    if (game.current[idx] !== 0) return { ok: false };
    if (game.notes[idx].has(val)) game.notes[idx].delete(val);
    else game.notes[idx].add(val);
    save(game);
    return { ok: true, note: true };
  }
  if (game.current[idx] === val) return { ok: false };

  game.current[idx] = val;
  game.notes[idx].clear();

  if (val !== game.solution[idx]) {
    game.mistakes += 1;
    if (game.mistakes >= MAX_MISTAKES) game.status = "lost";
    save(game);
    return { ok: true, mistake: true, lost: game.status === "lost" };
  }
  cleanPeerNotes(game, idx, val);
  if (isWon(game)) {
    game.status = "won";
    setBest(game.difficulty, game.seconds);
    clearSave();
  } else {
    save(game);
  }
  return { ok: true, won: game.status === "won" };
}

export function erase(game, idx) {
  if (game.status !== "playing" || idx < 0 || game.locked[idx]) return false;
  game.current[idx] = 0;
  game.notes[idx].clear();
  save(game);
  return true;
}

export function hint(game, idx = -1) {
  if (game.status !== "playing" || game.hints <= 0) return -1;
  let target = idx;
  if (target < 0 || game.locked[target] || game.current[target] === game.solution[target]) {
    target = game.current.findIndex((v, i) => !game.locked[i] && v !== game.solution[i]);
  }
  if (target < 0) return -1;
  game.hints -= 1;
  game.current[target] = game.solution[target];
  game.locked[target] = true; // hinted cells lock like givens
  game.notes[target].clear();
  cleanPeerNotes(game, target, game.current[target]);
  if (isWon(game)) {
    game.status = "won";
    setBest(game.difficulty, game.seconds);
    clearSave();
  } else {
    save(game);
  }
  return target;
}

export function isWon(game) {
  for (let i = 0; i < 81; i++) if (game.current[i] !== game.solution[i]) return false;
  return true;
}

export function fmtTime(s) {
  const m = String((s / 60) | 0).padStart(2, "0");
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

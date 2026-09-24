// Pure Sudoku logic — no DOM. Testable in Node + browser.
export const HOLES = { easy: 38, medium: 48, hard: 55 };

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function peersOf(idx) {
  const r = (idx / 9) | 0;
  const c = idx % 9;
  const set = new Set();
  for (let i = 0; i < 9; i++) {
    set.add(r * 9 + i);
    set.add(i * 9 + c);
  }
  const br = ((r / 3) | 0) * 3;
  const bc = ((c / 3) | 0) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++) set.add((br + dr) * 9 + bc + dc);
  set.delete(idx);
  return [...set];
}

export function isValid(board, idx, val) {
  const r = (idx / 9) | 0;
  const c = idx % 9;
  for (let i = 0; i < 9; i++) {
    if (board[r * 9 + i] === val) return false;
    if (board[i * 9 + c] === val) return false;
  }
  const br = ((r / 3) | 0) * 3;
  const bc = ((c / 3) | 0) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (board[(br + dr) * 9 + bc + dc] === val) return false;
  return true;
}

function findEmpty(board) {
  // MRV: pick empty cell with fewest candidates (much faster counting)
  let best = -1;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue;
    let n = 0;
    for (let v = 1; v <= 9; v++) if (isValid(board, i, v)) n++;
    if (n === 0) return i; // dead end — fail fast
    if (n < bestCount) {
      bestCount = n;
      best = i;
      if (n === 1) break;
    }
  }
  return best;
}

// Solve in place. Returns true if solved. Randomizes trial order.
export function solve(board) {
  const idx = findEmpty(board);
  if (idx === -1) return true;
  for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isValid(board, idx, v)) {
      board[idx] = v;
      if (solve(board)) return true;
      board[idx] = 0;
    }
  }
  return false;
}

// Count solutions up to `limit` (for uniqueness checks). Mutates a copy.
export function countSolutions(board, limit = 2) {
  let count = 0;
  const b = board.slice();
  (function bt() {
    if (count >= limit) return;
    const idx = findEmpty(b);
    if (idx === -1) {
      count++;
      return;
    }
    for (let v = 1; v <= 9; v++) {
      if (isValid(b, idx, v)) {
        b[idx] = v;
        bt();
        b[idx] = 0;
        if (count >= limit) return;
      }
    }
  })();
  return count;
}

export function fullSolution() {
  const b = new Array(81).fill(0);
  solve(b);
  return b;
}

export function generate(difficulty = "easy") {
  const holes = HOLES[difficulty] ?? HOLES.easy;
  const solution = fullSolution();
  const puzzle = solution.slice();

  // Symmetric dig order
  const cells = shuffled([...Array(81).keys()]);
  const removed = new Set();
  let dug = 0;

  for (const idx of cells) {
    if (dug >= holes) break;
    if (removed.has(idx)) continue;
    const mirror = 80 - idx;
    const targets = removed.has(mirror) ? [idx] : [idx, mirror];

    const backup = targets.map((i) => puzzle[i]);
    targets.forEach((i) => (puzzle[i] = 0));

    if (countSolutions(puzzle, 2) !== 1) {
      // revert — breaks uniqueness
      targets.forEach((i, k) => (puzzle[i] = backup[k]));
    } else {
      targets.forEach((i) => removed.add(i));
      dug += targets.length;
    }
  }
  return { puzzle, solution };
}

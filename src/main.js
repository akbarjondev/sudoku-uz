import "./style.css";
import "./pwa.js";
import { createGame, load, save, place, erase, hint, fmtTime, getBest, MAX_MISTAKES } from "./game.js";
import { peersOf } from "./sudoku.js";

const boardEl = document.getElementById("board");
const numpadEl = document.getElementById("numpad");
const mistakesEl = document.getElementById("mistakes");
const hintsEl = document.getElementById("hints-left");
const timerEl = document.getElementById("timer");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySub = document.getElementById("overlay-sub");
const overlayBtn = document.getElementById("overlay-btn");

let game = load() || createGame("easy");
if (game.status !== "playing") {
  // don't resume finished/paused-dead states silently — start fresh but keep diff
  const d = game.difficulty || "easy";
  game = createGame(d);
}
let cells = [];

const DIFF_UZ = { easy: "Oson", medium: "O'rta", hard: "Qiyin" };
function diffName(d) {
  return DIFF_UZ[d] || d;
}

function buzz(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

function autoSelect() {
  if (game.selected < 0) {
    const first = game.current.findIndex((v, i) => !game.locked[i] && v === 0);
    if (first >= 0) game.selected = first;
  }
}

function showOverlay(title, sub, btn) {
  overlayTitle.textContent = title;
  overlaySub.innerHTML = sub || "";
  overlayBtn.textContent = btn || "Davom etish";
  overlayBtn.style.display = btn === "__hide" ? "none" : "";
  overlay.classList.remove("hidden");
}
function hideOverlay() {
  overlay.classList.add("hidden");
}

function buildBoard() {
  boardEl.innerHTML = "";
  cells = [];
  for (let i = 0; i < 81; i++) {
    const b = document.createElement("button");
    b.className = "cell";
    b.setAttribute("role", "gridcell");
    b.dataset.idx = i;
    b.addEventListener("click", () => {
      game.selected = i;
      render();
    });
    boardEl.appendChild(b);
    cells.push(b);
  }
}

function buildNumpad() {
  numpadEl.innerHTML = "";
  for (let v = 1; v <= 9; v++) {
    const b = document.createElement("button");
    b.textContent = v;
    b.addEventListener("click", () => doPlace(v));
    numpadEl.appendChild(b);
  }
}

function relatedSet(idx) {
  if (idx < 0) return new Set();
  return new Set(peersOf(idx));
}

function render(flashIdx = -1) {
  const sel = game.selected;
  const rel = relatedSet(sel);
  const selVal = sel >= 0 ? game.current[sel] : 0;

  for (let i = 0; i < 81; i++) {
    const el = cells[i];
    const val = game.current[i];
    el.classList.toggle("given", game.locked[i]);
    el.classList.toggle("selected", i === sel);
    el.classList.toggle("related", rel.has(i));
    el.classList.toggle("same", val !== 0 && selVal !== 0 && val === selVal && i !== sel);
    el.classList.toggle("error", val !== 0 && val !== game.solution[i] && !game.locked[i]);

    if (val !== 0) {
      el.textContent = val;
    } else if (game.notes[i].size > 0) {
      const n = document.createElement("span");
      n.className = "notes";
      let html = "";
      for (let v = 1; v <= 9; v++) html += `<span>${game.notes[i].has(v) ? v : ""}</span>`;
      n.innerHTML = html;
      el.innerHTML = "";
      el.appendChild(n);
    } else {
      el.textContent = "";
    }
    if (i === flashIdx) {
      el.classList.remove("hint-flash");
      void el.offsetWidth;
      el.classList.add("hint-flash");
    }
  }

  mistakesEl.textContent = `❌ Xato ${game.mistakes}/${MAX_MISTAKES}`;
  hintsEl.textContent = `💡 Ishora: ${game.hints}`;
  timerEl.textContent = `⏱ ${fmtTime(game.seconds)}`;
  const best = getBest()[game.difficulty];
  bestEl.textContent = `Rekord: ${best != null ? fmtTime(best) : "—"}`;

  document.querySelectorAll(".diff").forEach((d) =>
    d.classList.toggle("active", d.dataset.diff === game.difficulty)
  );
  const nb = document.getElementById("btn-notes");
  nb.textContent = `✏ Qayd: ${game.notesMode ? "yoq" : "o'chiq"}`;
  nb.setAttribute("aria-pressed", String(game.notesMode));

  if (game.status === "won") {
    showOverlay("TABRIKLAYMIZ! 🎉", `${diffName(game.difficulty)} · ${fmtTime(game.seconds)}<br />Yana o'ynaysizmi?`, "Yangi o'yin");
  } else if (game.status === "lost") {
    showOverlay("O'YIN TUGADI", `3 ta xato — yechim ko'rsatildi.<br />Yangi o'yin bosing`, "Yangi o'yin");
    // reveal solution dimly on loss
    for (let i = 0; i < 81; i++) {
      if (!game.locked[i] && game.current[i] !== game.solution[i]) {
        cells[i].textContent = game.solution[i];
        cells[i].style.opacity = "0.55";
      }
    }
  }
}

function doPlace(v) {
  if (game.status !== "playing") return;
  if (game.selected < 0) autoSelect();
  const r = place(game, game.selected, v);
  if (r.mistake) buzz(80);
  else if (r.won) buzz([30, 50, 80]);
  else if (r.ok) buzz(10);
  render();
}

function doErase() {
  if (game.status === "playing" && game.selected >= 0) {
    erase(game, game.selected);
    render();
  }
}

function doHint() {
  if (game.status !== "playing") return;
  const t = hint(game, game.selected);
  if (t >= 0) {
    game.selected = t;
    buzz(20);
    render(t);
  }
}

function newGame(difficulty) {
  showOverlay("Yaratilmoqda…", diffName(difficulty || game.difficulty), "__hide");
  setTimeout(() => {
    game = createGame(difficulty || game.difficulty);
    cells.forEach((c) => (c.style.opacity = ""));
    autoSelect();
    save(game);
    hideOverlay();
    render();
  }, 30);
}

// ---- events ----
document.getElementById("btn-new").addEventListener("click", () => newGame());
document.getElementById("btn-erase").addEventListener("click", doErase);
document.getElementById("btn-hint").addEventListener("click", doHint);
document.getElementById("btn-notes").addEventListener("click", () => {
  game.notesMode = !game.notesMode;
  save(game);
  render();
});
document.getElementById("btn-pause").addEventListener("click", () => {
  if (game.status === "playing") {
    game.status = "paused";
    save(game);
    showOverlay("Pauza", `${diffName(game.difficulty)} · ${fmtTime(game.seconds)}`, "Davom etish");
  }
});
overlayBtn.addEventListener("click", () => {
  if (game.status === "paused") {
    game.status = "playing";
    save(game);
    hideOverlay();
  } else if (game.status === "won" || game.status === "lost") {
    hideOverlay();
    newGame();
  } else {
    hideOverlay();
  }
});

document.querySelectorAll(".diff").forEach((d) =>
  d.addEventListener("click", () => newGame(d.dataset.diff))
);

window.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "9") doPlace(Number(e.key));
  else if (e.key === "Backspace" || e.key === "0" || e.key === "Delete") doErase();
  else if (e.key === "n" || e.key === "N") {
    game.notesMode = !game.notesMode;
    render();
  } else if (e.key === "h" || e.key === "H") doHint();
  else if (e.key.startsWith("Arrow") && game.selected >= 0) {
    e.preventDefault();
    const r = (game.selected / 9) | 0;
    const c = game.selected % 9;
    let nr = r;
    let nc = c;
    if (e.key === "ArrowUp") nr = (r + 8) % 9;
    if (e.key === "ArrowDown") nr = (r + 1) % 9;
    if (e.key === "ArrowLeft") nc = (c + 8) % 9;
    if (e.key === "ArrowRight") nc = (c + 1) % 9;
    game.selected = nr * 9 + nc;
    render();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.status === "playing") {
    game.status = "paused";
    save(game);
    render();
    showOverlay("Pauza", "Sahifa yashirildi — taymer to'xtadi", "Davom etish");
  }
});

// timer — only counts while playing
setInterval(() => {
  if (game.status === "playing") {
    game.seconds += 1;
    timerEl.textContent = `⏱ ${fmtTime(game.seconds)}`;
    if (game.seconds % 10 === 0) save(game);
  }
}, 1000);

// ---- init ----
buildBoard();
buildNumpad();
autoSelect();
save(game);
render();

import "./style.css";
import "./pwa.js";
import { createGame, load, save, place, erase, hint, fmtTime, getBest, MAX_MISTAKES } from "./game.js";
import { buildBoard, buildNumpad, paintCells } from "./ui/board.js";
import { applyButtonStyles } from "./ui/components.js";
import { loadSettings, saveSettings, applyTheme, watchSystemTheme } from "./settings.js";
import { buildSettingsModal, syncSettingsModal, showSettingsModal } from "./ui/settings-modal.js";

const boardEl = document.getElementById("board");
const numpadEl = document.getElementById("numpad");
const mistakesEl = document.getElementById("mistakes");
const mistakesVal = document.getElementById("mistakes-val");
const hintsEl = document.getElementById("hints-left");
const hintsVal = document.getElementById("hints-val");
const timerEl = document.getElementById("timer");
const timerVal = document.getElementById("timer-val");
const bestEl = document.getElementById("best");
const bestVal = document.getElementById("best-val");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySub = document.getElementById("overlay-sub");
const overlayBtn = document.getElementById("overlay-btn");

let settings = loadSettings();
applyTheme(settings);
watchSystemTheme(() => settings);

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
  if (!settings.haptics) return;
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

function render(flashIdx = -1) {
  paintCells(cells, game, settings, flashIdx);

  if (mistakesVal) mistakesVal.textContent = `${game.mistakes}/${MAX_MISTAKES}`;
  if (hintsVal) hintsVal.textContent = `${game.hints}`;
  if (timerVal) timerVal.textContent = fmtTime(game.seconds);
  const best = getBest()[game.difficulty];
  if (bestVal) bestVal.textContent = best != null ? fmtTime(best) : "—";

  // Settings visibility toggles
  mistakesEl.style.display = settings.showMistakes ? "" : "none";
  timerEl.style.display = settings.showTimer ? "" : "none";
  bestEl.style.display = settings.showBest ? "" : "none";

  document.querySelectorAll(".diff").forEach((d) =>
    d.classList.toggle("active", d.dataset.diff === game.difficulty)
  );
  const nb = document.getElementById("btn-notes");
  nb.setAttribute("aria-pressed", String(game.notesMode));
  nb.setAttribute("aria-label", game.notesMode ? "Qayd rejimi: yoqilgan" : "Qayd rejimi: o'chirilgan");
  nb.setAttribute("title", game.notesMode ? "Qayd: yoqilgan" : "Qayd: o'chirilgan");
  nb.classList.toggle("is-active", game.notesMode);

  if (game.status === "won") {
    showOverlay("TABRIKLAYMIZ!", `${diffName(game.difficulty)} · ${fmtTime(game.seconds)}<br />Yana o'ynaysizmi?`, "Yangi o'yin");
  } else if (game.status === "lost") {
    showOverlay("O'YIN TUGADI", `${MAX_MISTAKES} ta xato — yechim ko'rsatildi.<br />Yangi o'yin bosing`, "Yangi o'yin");
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
  const r = place(game, game.selected, v, { autoCleanNotes: settings.autoCleanNotes });
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
  const t = hint(game, game.selected, { autoCleanNotes: settings.autoCleanNotes });
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

function onSettingsChange(patch) {
  settings = { ...settings, ...patch };
  saveSettings(settings);
  applyTheme(settings);
  syncSettingsModal(settings);
  render();
}

// ---- upgrade legacy static buttons to .btn system (idempotent) ----
function upgradeStaticButtons() {
  document.querySelectorAll(".diff").forEach((d) => {
    d.classList.add("btn", "btn--sm");
  });
  document.querySelectorAll(".toolbar button, .numpad button, .overlay button").forEach((b) => {
    if (!b.classList.contains("btn")) applyButtonStyles(b);
  });
  const install = document.getElementById("btn-install");
  if (install) install.classList.add("btn", "btn--sm", "btn--primary");
  const settingsBtn = document.getElementById("btn-settings");
  if (settingsBtn && !settingsBtn.classList.contains("icon-btn")) {
    settingsBtn.classList.add("icon-btn");
  }
  if (overlayBtn && !overlayBtn.classList.contains("btn--primary")) {
    overlayBtn.classList.add("btn", "btn--primary", "btn--lg");
  }
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

document.getElementById("btn-settings")?.addEventListener("click", () => {
  showSettingsModal(settings);
});

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
    if (timerVal) timerVal.textContent = fmtTime(game.seconds);
    if (game.seconds % 10 === 0) save(game);
  }
}, 1000);

// ---- init ----
cells = buildBoard(boardEl, (i) => {
  game.selected = i;
  render();
});
buildNumpad(numpadEl, doPlace);
buildSettingsModal({ onChange: onSettingsChange });
upgradeStaticButtons();
autoSelect();
save(game);
render();

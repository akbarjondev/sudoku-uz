/* Single reusable Sudoku table components — board + numpad. */
import { peersOf } from "../sudoku.js";

export function buildBoard(boardEl, onSelect) {
  boardEl.innerHTML = "";
  const cells = [];
  for (let i = 0; i < 81; i++) {
    const b = document.createElement("button");
    b.className = "cell";
    b.setAttribute("role", "gridcell");
    b.dataset.idx = i;
    b.addEventListener("click", () => onSelect(i));
    boardEl.appendChild(b);
    cells.push(b);
  }
  return cells;
}

export function buildNumpad(numpadEl, onPlace) {
  numpadEl.innerHTML = "";
  const btns = [];
  for (let v = 1; v <= 9; v++) {
    const b = document.createElement("button");
    b.textContent = v;
    b.setAttribute("aria-label", `Raqam ${v}`);
    b.addEventListener("click", () => onPlace(v));
    numpadEl.appendChild(b);
    btns.push(b);
  }
  return btns;
}

export function relatedSet(idx) {
  if (idx < 0) return new Set();
  return new Set(peersOf(idx));
}

function renderNotes(el, notesSet) {
  const n = document.createElement("span");
  n.className = "notes";
  let html = "";
  for (let v = 1; v <= 9; v++) html += `<span>${notesSet.has(v) ? v : ""}</span>`;
  n.innerHTML = html;
  el.innerHTML = "";
  el.appendChild(n);
}

/* Paint all cells — highlights gated by settings toggles. */
export function paintCells(cells, game, settings, flashIdx = -1) {
  const sel = game.selected;
  const rel = relatedSet(sel);
  const selVal = sel >= 0 ? game.current[sel] : 0;
  const showRelated = settings?.highlightRelated !== false;
  const showSame = settings?.highlightSame !== false;

  for (let i = 0; i < 81; i++) {
    const el = cells[i];
    const val = game.current[i];
    el.classList.toggle("given", game.locked[i]);
    el.classList.toggle("selected", i === sel);
    el.classList.toggle("related", showRelated && rel.has(i));
    el.classList.toggle("same", showSame && val !== 0 && selVal !== 0 && val === selVal && i !== sel);
    el.classList.toggle("error", val !== 0 && val !== game.solution[i] && !game.locked[i]);

    if (val !== 0) {
      el.textContent = val;
    } else if (game.notes[i].size > 0) {
      renderNotes(el, game.notes[i]);
    } else {
      el.textContent = "";
    }
    if (i === flashIdx) {
      el.classList.remove("hint-flash");
      void el.offsetWidth;
      el.classList.add("hint-flash");
    }
  }
}

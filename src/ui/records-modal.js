/* Records history modal — trophy bottom-sheet, persisted in localStorage. */
import { getHistory, clearHistory, fmtTime } from "../game.js";
import { icon } from "./icons.js";

const DIFFS = [
  { value: "easy", label: "Oson" },
  { value: "medium", label: "O'rta" },
  { value: "hard", label: "Qiyin" },
];

let activeDiff = "easy";

function fmtDate(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

function renderList(listEl) {
  const all = getHistory().filter((e) => e.diff === activeDiff);
  all.sort((a, b) => a.seconds - b.seconds);
  listEl.innerHTML = "";
  if (all.length === 0) {
    const empty = document.createElement("div");
    empty.className = "records-empty";
    empty.textContent = "Hali rekord yo'q — o'yinni yakunlang!";
    listEl.appendChild(empty);
    return;
  }
  all.forEach((e, i) => {
    const row = document.createElement("div");
    row.className = "records-row";
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    row.innerHTML = `<span class="records-rank"></span>
      <span class="records-main"><b></b><small></small></span>
      <span class="records-sub"></span>`;
    row.querySelector(".records-rank").textContent = medal;
    row.querySelector(".records-main b").textContent = fmtTime(e.seconds);
    row.querySelector(".records-main small").textContent = fmtDate(e.date);
    row.querySelector(".records-sub").textContent = `Xato ${e.mistakes ?? 0}`;
    listEl.appendChild(row);
  });
}

function syncTabs(backdrop) {
  backdrop.querySelectorAll(".records-tabs .btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.recordsDiff === activeDiff);
  });
  renderList(backdrop.querySelector("#records-list"));
}

export function buildRecordsModal() {
  let backdrop = document.getElementById("records-backdrop");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.id = "records-backdrop";
  backdrop.className = "settings-backdrop hidden";
  backdrop.innerHTML = `
    <div class="settings-sheet" role="dialog" aria-modal="true" aria-label="Rekordlar tarixi">
      <div class="settings-head">
        <h2>Rekordlar</h2>
        <button class="icon-btn" id="records-close" aria-label="Yopish">${icon("x")}</button>
      </div>
      <div class="records-tabs" id="records-tabs"></div>
      <div class="records-list" id="records-list"></div>
      <div class="settings-foot">
        <button class="btn btn--md" id="records-clear">Tozalash</button>
        <button class="btn btn--primary btn--md" id="records-done">Yopish</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const tabs = backdrop.querySelector("#records-tabs");
  for (const d of DIFFS) {
    const b = document.createElement("button");
    b.className = "btn btn--md";
    b.textContent = d.label;
    b.dataset.recordsDiff = d.value;
    b.addEventListener("click", () => {
      activeDiff = d.value;
      syncTabs(backdrop);
    });
    tabs.appendChild(b);
  }

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) hideRecordsModal();
  });
  backdrop.querySelector("#records-close").addEventListener("click", hideRecordsModal);
  backdrop.querySelector("#records-done").addEventListener("click", hideRecordsModal);
  backdrop.querySelector("#records-clear").addEventListener("click", () => {
    if (!window.confirm("Shu darajadagi tarix o'chirilsinmi?")) return;
    clearHistory(activeDiff);
    syncTabs(backdrop);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.classList.contains("hidden")) hideRecordsModal();
  });
  return backdrop;
}

export function showRecordsModal(initialDiff = "easy") {
  const backdrop = document.getElementById("records-backdrop");
  if (!backdrop) return;
  if (initialDiff) activeDiff = initialDiff;
  syncTabs(backdrop);
  backdrop.classList.remove("hidden");
}

export function hideRecordsModal() {
  document.getElementById("records-backdrop")?.classList.add("hidden");
}

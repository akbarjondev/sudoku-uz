/* Settings modal — bottom-sheet UI bound to settings store. */
import { MAX_HINTS, MAX_MISTAKES } from "../game.js";
import { icon } from "./icons.js";

const TOGGLES = [
  { key: "showTimer", label: "Taymer", desc: "Vaqt ko'rsatkichi" },
  { key: "showMistakes", label: "Xatolar hisoblagichi", desc: `Limit: ${MAX_MISTAKES} ta` },
  { key: "showBest", label: "Rekord", desc: "Eng yaxshi vaqt" },
  { key: "highlightSame", label: "Bir xil raqamlar", desc: "Tanlangan raqamni ajratish" },
  { key: "highlightRelated", label: "Qator / ustun / blok", desc: "Bog'liq kataklarni ajratish" },
  { key: "haptics", label: "Tebranish", desc: "Telefonda vibratsiya" },
  { key: "autoCleanNotes", label: "Qaydlarni tozalash", desc: "Raqam qo'yilganda ortiqcha qaydlarni o'chirish" },
];

const THEMES = [
  { value: "system", label: "Tizim", iconName: "monitor" },
  { value: "dark", label: "To‘q", iconName: "moon" },
  { value: "light", label: "Yorug‘", iconName: "sun" },
];

export function buildSettingsModal({ onChange }) {
  let backdrop = document.getElementById("settings-backdrop");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.id = "settings-backdrop";
  backdrop.className = "settings-backdrop hidden";
  backdrop.innerHTML = `
    <div class="settings-sheet" role="dialog" aria-modal="true" aria-label="Sozlamalar">
      <div class="settings-head">
        <h2>Sozlamalar</h2>
        <button class="icon-btn" id="settings-close" aria-label="Yopish">${icon("x")}</button>
      </div>
      <div class="settings-group">
        <h3>Mavzu</h3>
        <div class="theme-segment" id="theme-segment"></div>
      </div>
      <div class="settings-group">
        <h3>O'yin</h3>
        <div class="settings-info"><span>${icon("circle-x")} Xato limiti</span><b>${MAX_MISTAKES} ta</b></div>
        <div class="settings-info"><span>${icon("lightbulb")} Ishora</span><b>${MAX_HINTS} ta</b></div>
      </div>
      <div class="settings-group">
        <h3>Ko'rinish va ovoz</h3>
        <div id="settings-toggles"></div>
      </div>
      <div class="settings-foot">
        <button class="btn btn--primary btn--lg" id="settings-done">Tayyor</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) hideSettingsModal();
  });
  backdrop.querySelector("#settings-close").addEventListener("click", hideSettingsModal);
  backdrop.querySelector("#settings-done").addEventListener("click", hideSettingsModal);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.classList.contains("hidden")) hideSettingsModal();
  });

  // Build theme buttons + toggles once; sync on open.
  const seg = backdrop.querySelector("#theme-segment");
  for (const t of THEMES) {
    const b = document.createElement("button");
    b.className = "btn btn--md";
    b.innerHTML = `${icon(t.iconName)}<span>${t.label}</span>`;
    b.setAttribute("aria-label", t.label);
    b.dataset.themeValue = t.value;
    b.addEventListener("click", () => onChange({ theme: t.value }));
    seg.appendChild(b);
  }
  const tWrap = backdrop.querySelector("#settings-toggles");
  for (const t of TOGGLES) {
    const row = document.createElement("div");
    row.className = "settings-row";
    row.innerHTML = `<div>${t.label}<small>${t.desc}</small></div>`;
    const sw = document.createElement("button");
    sw.className = "switch";
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-label", t.label);
    sw.dataset.toggleKey = t.key;
    sw.addEventListener("click", () => onChange({ [t.key]: !(sw.getAttribute("aria-checked") === "true") }));
    row.appendChild(sw);
    tWrap.appendChild(row);
  }
  return backdrop;
}

export function syncSettingsModal(settings) {
  const backdrop = document.getElementById("settings-backdrop");
  if (!backdrop) return;
  backdrop.querySelectorAll("#theme-segment .btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.themeValue === settings.theme);
  });
  backdrop.querySelectorAll(".switch").forEach((sw) => {
    sw.setAttribute("aria-checked", String(!!settings[sw.dataset.toggleKey]));
  });
}

export function showSettingsModal(settings) {
  const backdrop = document.getElementById("settings-backdrop");
  if (!backdrop) return;
  syncSettingsModal(settings);
  backdrop.classList.remove("hidden");
}

export function hideSettingsModal() {
  document.getElementById("settings-backdrop")?.classList.add("hidden");
}

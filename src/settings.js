/* Settings store — theme + gameplay toggles, persisted. */
const SETTINGS_KEY = "sudoku-settings-v1";

export const DEFAULT_SETTINGS = {
  theme: "system", // system | dark | light
  showTimer: true,
  showMistakes: true,
  showBest: true,
  highlightSame: true,
  highlightRelated: true,
  haptics: true,
  autoCleanNotes: true,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

function resolveTheme(theme) {
  if (theme === "dark" || theme === "light") return theme;
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(settings) {
  const theme = settings?.theme || "system";
  // Keep data-theme for CSS; brand chrome stays Garden sage per DS.
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", "#56633f");
}

/* Follow OS changes when theme=system */
let mediaListenerAttached = false;
export function watchSystemTheme(getSettings) {
  if (mediaListenerAttached) return;
  mediaListenerAttached = true;
  try {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", () => {
      const s = getSettings();
      if (s.theme === "system") applyTheme(s);
    });
  } catch { /* ignore */ }
}

import { registerSW } from "virtual:pwa-register";

const toast = document.getElementById("update-toast");
const btnUpdate = document.getElementById("btn-update");
const btnInstall = document.getElementById("btn-install");
const iosTip = document.getElementById("ios-tip");
const iosClose = document.getElementById("ios-close");

let updateSW = () => {};
let deferredPrompt = null;

if ("serviceWorker" in navigator) {
  updateSW = registerSW({
    onNeedRefresh() {
      toast?.classList.remove("hidden");
    },
    onOfflineReady() {},
  });
}

btnUpdate?.addEventListener("click", () => updateSW(true));

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function refreshInstallVisibility() {
  if (!btnInstall) return;
  if (isStandalone()) {
    btnInstall.classList.add("hidden");
    iosTip?.classList.add("hidden");
    return;
  }
  btnInstall.classList.toggle("hidden", !deferredPrompt);
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  refreshInstallVisibility();
});

btnInstall?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => {});
  deferredPrompt = null;
  refreshInstallVisibility();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  refreshInstallVisibility();
});

// iOS: prompt yo'q — yo'riqnoma ko'rsatamiz (bir marta)
try {
  const isiOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const dismissed = localStorage.getItem("sudoku-ios-tip") === "1";
  if (isiOS && !isStandalone() && !dismissed) iosTip?.classList.remove("hidden");
} catch { /* ignore */ }

iosClose?.addEventListener("click", () => {
  iosTip?.classList.add("hidden");
  try {
    localStorage.setItem("sudoku-ios-tip", "1");
  } catch { /* ignore */ }
});

refreshInstallVisibility();

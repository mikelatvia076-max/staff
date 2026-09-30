// Agnes Staff Portal: install app banner + "internet required" lock screen.

// ---------- service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

// ---------- install app ----------
const $$ = (id) => document.getElementById(id);
const installBtns = () => document.querySelectorAll(".js-install");
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const DISMISS_KEY = "agnesInstallDismissed", DISMISS_DAYS = 7;
let deferredPrompt = null;

function dismissed() {
  try { const t = Number(localStorage.getItem(DISMISS_KEY)); return t && Date.now() - t < DISMISS_DAYS * 864e5; }
  catch (e) { return false; }
}
function showBanner() {
  if (standalone || dismissed()) return;
  $$("installBanner").hidden = false;
}
function hideBanner() { $$("installBanner").hidden = true; }

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (standalone) return;
  installBtns().forEach((b) => (b.hidden = false));
  showBanner();
});

document.addEventListener("click", async (e) => {
  if (!e.target.closest(".js-install") || !deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtns().forEach((b) => (b.hidden = true));
  hideBanner();
});

$$("ibClose").onclick = () => {
  hideBanner();
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ }
};

window.addEventListener("appinstalled", () => { installBtns().forEach((b) => (b.hidden = true)); hideBanner(); });

// iPhone/iPad Safari has no install prompt, so explain the manual steps instead.
if (isIOS && !standalone) {
  const hint = $$("iosHint"); if (hint) hint.hidden = false;
  $$("ibText").textContent = "Tap Share, then Add to Home Screen.";
  $$("ibInstall").hidden = true;
  showBanner();
}

// ---------- internet required ----------
const offDlg = $$("offlineDialog");
offDlg.addEventListener("cancel", (e) => e.preventDefault());   // Esc cannot close it

function lockApp() {
  if (offDlg.open) return;
  $$("offMsg").textContent = "";
  offDlg.showModal();
}
function unlockApp() {
  if (offDlg.open) offDlg.close();
}

// Asks the real network (the service worker skips "ping" requests), so a cached page can't fake a connection.
async function checkOnline() {
  if (!navigator.onLine) return false;
  try {
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 8000);
    await fetch("manifest.json?ping=" + Date.now(), { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    return true;
  } catch (e) { return false; }
}
async function refreshStatus() { (await checkOnline()) ? unlockApp() : lockApp(); }

window.addEventListener("offline", lockApp);
window.addEventListener("online", refreshStatus);

$$("offRetry").onclick = async () => {
  const b = $$("offRetry"); b.disabled = true; $$("offMsg").textContent = "Checking connection...";
  if (await checkOnline()) unlockApp();
  else $$("offMsg").textContent = "Still offline. Check your Wi-Fi or mobile data.";
  b.disabled = false;
};

// Re-check when the app comes back to the front, and keep checking while locked.
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshStatus(); });
setInterval(() => { if (offDlg.open) refreshStatus(); }, 5000);

if (!navigator.onLine) lockApp();
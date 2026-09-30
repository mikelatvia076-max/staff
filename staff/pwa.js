// Registers the service worker and shows an "Install app" button when the browser allows it.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

const installBtns = () => document.querySelectorAll(".js-install");
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!standalone) installBtns().forEach((b) => (b.hidden = false));
});

document.addEventListener("click", async (e) => {
  if (!e.target.closest(".js-install") || !deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtns().forEach((b) => (b.hidden = true));
});

window.addEventListener("appinstalled", () => installBtns().forEach((b) => (b.hidden = true)));

// iPhone/iPad Safari has no install prompt, so show a short how-to instead.
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) {
  const hint = document.getElementById("iosHint");
  if (hint) hint.hidden = false;
}
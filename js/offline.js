let deferredInstallPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js");
  });
}

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  const button = document.getElementById("installAppButton");
  if (button) button.hidden = false;
});

window.addEventListener("appinstalled", function () {
  deferredInstallPrompt = null;
  const button = document.getElementById("installAppButton");
  if (button) button.hidden = true;
});

window.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("installAppButton");
  if (!button) return;
  button.addEventListener("click", async function () {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
    button.hidden = true;
  });
});
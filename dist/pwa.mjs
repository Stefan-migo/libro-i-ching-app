let installPrompt;
const standalone = matchMedia("(display-mode: standalone)");

function renderInstallPage() {
 const button = document.querySelector("#install-app");
 if (!button) return;
 const installed = standalone.matches || navigator.standalone === true;
 button.hidden = !installPrompt || installed;
 document.querySelector("#install-status").textContent =
   installed ? "I Ching se está ejecutando como aplicación." : "";
 button.onclick = async () => {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = undefined;
  renderInstallPage();
  try { await prompt.prompt(); } catch { /* Leave the browser instructions visible. */ }
 };
}

window.addEventListener("beforeinstallprompt", event => {
 event.preventDefault();
 installPrompt = event;
 renderInstallPage();
});
window.addEventListener("appinstalled", () => {
 installPrompt = undefined;
 renderInstallPage();
});
standalone.addEventListener("change", renderInstallPage);
document.addEventListener("render-install-page", renderInstallPage);
renderInstallPage();

if ("serviceWorker" in navigator) {
 navigator.serviceWorker.register(new URL("./sw.js", import.meta.url)).catch(error => {
  console.warn("No se pudo activar el modo de aplicación.", error);
 });
}

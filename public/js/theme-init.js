// ちらつかないよう <head> で同期読み込みする
try {
  const root = document.documentElement;
  const mode = localStorage.getItem("ct.mode");
  const accent = localStorage.getItem("ct.accent");
  if (mode === "light" || mode === "dark") root.dataset.mode = mode;
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) root.style.setProperty("--accent", accent);
} catch {}

for (const link of document.querySelectorAll("link[data-async-css]")) {
  if (link.sheet) link.media = "all";
  else link.addEventListener("load", () => (link.media = "all"), { once: true });
}

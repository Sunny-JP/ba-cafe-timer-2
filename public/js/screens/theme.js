// テーマ(ライト / ダーク / アクセント色)。
import { t } from "../features/i18n.js";
import { icon } from "./views.js";
import { state, store } from "../features/state.js";
import { $ } from "./ui.js";

export const dark = matchMedia("(prefers-color-scheme: dark)");
export const isDark = () => (state.mode === "auto" ? dark.matches : state.mode === "dark");

export function applyTheme() {
  const root = document.documentElement;
  if (state.mode === "auto") root.removeAttribute("data-mode");
  else root.dataset.mode = state.mode;
  root.style.setProperty("--accent", state.accent);
  $("#theme-btn").innerHTML = icon(isDark() ? "sun" : "moon");
  $("#theme-btn").setAttribute("aria-label", t(isDark() ? "toLight" : "toDark"));
}

export function setMode(mode) {
  state.mode = mode;
  store.set("mode", mode);
  applyTheme();
}

export function setAccent(color) {
  state.accent = color;
  store.set("accent", color);
  applyTheme();
}

// テーマ色(light-dark() 解決後)を取得する
export const css = (name) => {
  const el = document.createElement("div");
  el.style.color = `var(${name})`;
  document.body.append(el);
  const c = getComputedStyle(el).color;
  el.remove();
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  px.fillStyle = c;
  px.fillRect(0, 0, 1, 1);
  const [r, g, b] = px.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
};

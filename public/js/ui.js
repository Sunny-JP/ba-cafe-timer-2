import { log, preloadGsi } from "./api.js";
import { drawChart } from "./chart.js";
import { getLang, t } from "./i18n.js";
import { DEMO, DEMO_ACTIONS, state, store } from "./state.js";
import { calendarBody, icon, noticeBanner, renderAds, renderBond, renderCalendar, renderDoc, renderLogList, renderMenu, renderSettings, renderTimer, skeleton, tick } from "./views.js";

export const $ = (selector) => document.querySelector(selector);
export const view = $("#view");

export const wide = matchMedia("(min-width: 900px) and (orientation: landscape)");
const TAB_VIEWS = { timer: renderTimer, calendar: renderCalendar, bond: renderBond, settings: renderSettings, doc: renderDoc };

const currentTab = () => (wide.matches && state.tab === "calendar" ? "timer" : state.tab);

function tabHtml(tab) {
  if (state.loading) return skeleton();
  if (tab === "timer" && wide.matches) return `<div class="cols"><div>${renderTimer(state)}</div><div>${renderCalendar(state)}</div></div>`;
  return TAB_VIEWS[tab](state);
}

export function render(animate = false) {
  const tab = currentTab();
  const ads = $("#ads");
  if (ads && view.contains(ads)) view.after(ads);
  view.innerHTML = tabHtml(tab);
  placeAds();
  if ($("#menu").open) renderMenuBody();
  const notice = $("#notice");
  notice.hidden = !(tab === "timer" && state.notice);
  notice.innerHTML = notice.hidden ? "" : noticeBanner(state.notice);
  for (const button of document.querySelectorAll("nav button")) button.setAttribute("aria-selected", button.dataset.tab === tab);
  tick(view);
  drawChart();
  updateGiftNav();
  lockDemo(view);
  if (animate) {
    view.classList.remove("enter");
    void view.offsetWidth;
    view.classList.add("enter");
  }
}

export function showAds() {
  const ads = $("#ads");
  ads.innerHTML = renderAds(state);
  ads.hidden = !state.ads?.length;
  placeAds();
}

function placeAds() {
  const ads = $("#ads");
  const leftColumn = wide.matches && view.querySelector(".cols > div");
  if (ads && leftColumn) leftColumn.append(ads);
}

export function renderCalendarArea() {
  const area = document.getElementById("cal-area");
  if (!area) return;
  area.innerHTML = calendarBody(state);
  tick(area);
  lockDemo(area);
}

export function renderMenuBody() {
  $("#menu-body").innerHTML = renderMenu(state);
  lockDemo($("#menu-body"));
}

export function toTimerScreen() {
  if ($("#menu").open) $("#menu").close();
  state.tab = "timer";
  render(true);
  scrollTo(0, 0);
}

function updateGiftNav() {
  for (const wrapper of document.querySelectorAll(".gifts-wrap")) {
    const list = wrapper.querySelector(".gifts");
    const hasLeft = list.scrollLeft > 1;
    const hasRight = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
    wrapper.querySelector(".prev").classList.toggle("show", hasLeft);
    wrapper.querySelector(".next").classList.toggle("show", hasRight);
    list.dataset.fade = (hasLeft ? "l" : "") + (hasRight ? "r" : "");
  }
}

function lockDemo(root) {
  if (!DEMO) return;
  for (const element of root.querySelectorAll("[data-act]")) {
    if (!DEMO_ACTIONS.has(element.dataset.act) && element.id !== "home-btn") element.dataset.demoOff = "";
  }
  for (const input of root.querySelectorAll('input[type="file"]')) {
    input.disabled = true;
    input.closest("label")?.setAttribute("data-demo-off", "");
  }
}

export function initRender() {
  document.addEventListener("scroll", (event) => event.target.classList?.contains("gifts") && updateGiftNav(), true);
  addEventListener("resize", updateGiftNav);
  wide.addEventListener("change", () => render(true));
}

let toastTimer = 0;
export function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  log.info("toast", message);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (element.hidden = true), 3500);
}

export const busy = {
  show(message, step = 0) {
    if (!$("#busy").open) $("#busy").showModal();
    $("#busy-msg").textContent = message;
    $("#busy-bar").value = step;
  },
  hide: () => $("#busy").close(),
};
$("#busy")?.addEventListener("cancel", (event) => event.preventDefault());

export async function withBusy(message, step, operation) {
  busy.show(message, step);
  try {
    return await operation();
  } finally {
    busy.hide();
  }
}

export function confirmDialog(message, okLabel, danger = false) {
  const dialog = $("#confirm");
  const okButton = $("#confirm-ok");
  $("#confirm-msg").textContent = message;
  okButton.textContent = okLabel;
  okButton.classList.toggle("danger", danger);
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    okButton.onclick = () => dialog.close("ok");
    $("#confirm-cancel").onclick = () => dialog.close("");
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
  });
}

export function closeOnOutsideClick(dialog) {
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
}

export function downloadBlob(blob, fileName) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function show(screen) {
  for (const id of ["loading", "login", "app"]) $(`#${id}`).hidden = id !== screen;
}

export function showReauth() {
  $("#reauth").hidden = false;
  preloadGsi();
}

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

export function cssColor(variable) {
  const probe = document.createElement("div");
  probe.style.color = `var(${variable})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  const pixel = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  pixel.fillStyle = color;
  pixel.fillRect(0, 0, 1, 1);
  const [red, green, blue] = pixel.getImageData(0, 0, 1, 1).data;
  return `rgb(${red}, ${green}, ${blue})`;
}

export function closeDropdowns() {
  for (const list of document.querySelectorAll(".dd-list.open")) {
    list.classList.remove("open");
    list.previousElementSibling.setAttribute("aria-expanded", "false");
  }
}

const normalize = (text) => text.toLowerCase().replace(/[ぁ-ゖ]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));

export function filterDropdown(input) {
  const query = normalize(input.value.trim());
  for (const item of input.closest(".dd-list").querySelectorAll("li[data-q]")) item.hidden = !!query && !normalize(item.dataset.q).includes(query);
}

export function toggleDropdown(button) {
  const list = button.nextElementSibling;
  const open = !list.classList.contains("open");
  closeDropdowns();
  list.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  const search = list.querySelector(".dd-q");
  if (search) {
    search.value = "";
    filterDropdown(search);
    if (open) search.focus({ preventScroll: true });
  }
  list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
}

export async function loadDoc(id) {
  const { html, translated } = (await import("./docs.js")).docHtml(id, getLang(), { ads: state.adsEnabled });
  const body = html.replace(/<ul class="log" data-update-log(?:="")?><\/ul>/, () => renderLogList());
  return (translated ? "" : `<p class="note info">${t("docFallback")}</p>`) + body;
}

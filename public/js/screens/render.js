// 画面の描画 (タブごとの本体・メニュー・お知らせ・デモ用の操作ロック)。
import { logicalMonth } from "../features/time.js";
import { noticeBanner, renderBond, renderCalendar, renderDoc, renderMenu, renderSettings, renderTimer, skeleton, tick } from "./views.js";
import { CAL_MIN, DEMO, DEMO_ACTIONS, state } from "../features/state.js";
import { drawChart } from "./chart.js";
import { $, view } from "./ui.js";

export const wide = matchMedia("(min-width: 900px) and (orientation: landscape)");

const TAB_RENDERERS = { timer: renderTimer, calendar: renderCalendar, bond: renderBond, settings: renderSettings, doc: renderDoc };

// 現在のタブの本文。横長の画面ではタイマーとカレンダーを並べて表示する(カレンダーのタブは隠れる)
function tabHtml(tab) {
  if (state.loading) return skeleton();
  if (tab === "timer" && wide.matches) return `<div class="cols"><div>${renderTimer(state)}</div><div>${renderCalendar(state)}</div></div>`;
  return TAB_RENDERERS[tab](state);
}

// 更新のお知らせ: ヘッダーの下に出す (タイマー画面のときだけ)
function renderNotice(tab) {
  const nb = $("#notice");
  if (!nb) return;
  const on = tab === "timer" && !!state.notice;
  nb.hidden = !on;
  nb.innerHTML = on ? noticeBanner(state.notice) : "";
}

export function render(animate = false) {
  state.calMinMonth = CAL_MIN;
  state.calMaxMonth = logicalMonth(Date.now());
  state.calAtMin = state.calMonth <= state.calMinMonth;
  state.calAtMax = state.calMonth >= state.calMaxMonth;
  const tab = wide.matches && state.tab === "calendar" ? "timer" : state.tab;
  view.innerHTML = tabHtml(tab);
  if ($("#menu").open) renderMenuBody();
  renderNotice(tab);
  tick(view);
  for (const b of document.querySelectorAll("nav button")) b.setAttribute("aria-selected", b.dataset.tab === tab);
  drawChart();
  updateGiftNav();
  lockDemo(view);
  if (animate) {
    // 画面遷移時だけ短いフェードイン(再描画のたびには動かさない)
    view.classList.remove("enter");
    void view.offsetWidth;
    view.classList.add("enter");
  }
}

export function renderMenuBody() {
  $("#menu-body").innerHTML = renderMenu(state);
  lockDemo($("#menu-body"));
}

// 取り込み・消去の前に、メニューを閉じてタイマー画面へ戻る
export function toTimerScreen() {
  if ($("#menu").open) $("#menu").close();
  state.tab = "timer";
  render(true);
  scrollTo(0, 0);
}

// 贈物の一覧に続きがあるとき、端のぼかしと矢印で横スクロールできることを示す
export function updateGiftNav() {
  for (const wrap of document.querySelectorAll(".gifts-wrap")) {
    const list = wrap.querySelector(".gifts");
    const left = list.scrollLeft > 1;
    const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
    wrap.querySelector(".prev").classList.toggle("show", left);
    wrap.querySelector(".next").classList.toggle("show", right);
    list.dataset.fade = (left ? "l" : "") + (right ? "r" : "");
  }
}

// デモ画面: 押しても何も起きない操作に印を付け、ファイルの選択(インポート)も開かないようにする
function lockDemo(root) {
  if (!DEMO) return;
  for (const el of root.querySelectorAll("[data-act]")) if (!DEMO_ACTIONS.has(el.dataset.act) && el.id !== "home-btn") el.dataset.demoOff = "";
  for (const input of root.querySelectorAll('input[type="file"]')) {
    input.disabled = true;
    input.closest("label")?.setAttribute("data-demo-off", "");
  }
}

export function initRender() {
  document.addEventListener("scroll", (e) => e.target.classList?.contains("gifts") && updateGiftNav(), true);
  addEventListener("resize", updateGiftNav);
  wide.addEventListener("change", () => render(true));
}

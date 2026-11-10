// ページ全体のイベント (ボタンの委譲・タブ・メニュー・操作の制限)。
import { log } from "./log.js";
import { icon } from "../screens/views.js";
import { DEMO, DEMO_ACTIONS, state } from "./state.js";
import { actions } from "./actions.js";
import { loadDeferred } from "./data.js";
import { closeDropdowns, filterDropdown } from "../screens/dropdown.js";
import { render, renderMenuBody } from "../screens/render.js";
import { $, closeOnOutsideClick } from "../screens/ui.js";

// 押した結果で描き直されたボタンも、沈んだ状態からふわっと戻す
function reboundButton(b) {
  if (b.isConnected) return;
  const { act, n, day } = b.dataset;
  const again = document.querySelector(`[data-act="${act}"]${n ? `[data-n="${n}"]` : ""}${day ? `[data-day="${day}"]` : ""}`);
  if (!again) return;
  again.classList.add("rebound");
  again.addEventListener("animationend", () => again.classList.remove("rebound"), { once: true });
}

// ビューとメニューの両方で、data-act を委譲処理する
function onClick(e) {
  if (!e.target.closest(".dd")) closeDropdowns();
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const { act } = b.dataset;
  log.info("click", `data-act="${act}"`, { ...b.dataset, handler: !!actions[act], demo: DEMO, online: navigator.onLine, user: state.user?.uid ?? null });
  if (DEMO && !DEMO_ACTIONS.has(act)) return;
  if (!actions[act]) log.warn("click", `no handler for action: ${act}`);
  try {
    const r = actions[act]?.(b);
    if (r?.catch) r.catch((err) => log.error("click", `action rejected: ${act}`, err));
  } catch (err) {
    log.error("click", `action threw: ${act}`, err);
  }
  reboundButton(b);
}

function onNavClick(e) {
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  log.info("nav", `tab click ${state.tab} -> ${b.dataset.tab}`, { bondReady: state.bondReady, deferredLoading: state.deferredLoading });
  if (state.tab === b.dataset.tab) return;
  state.tab = b.dataset.tab;
  render(true);
  if (!state.bondReady && !state.deferredLoading) loadDeferred(); // 裏の読み込みが失敗していたときのやり直し
}

// 入力欄以外ではコピー・選択・ドラッグを止める
function blockCopying() {
  const isField = (e) => e.target instanceof Element && e.target.closest("input, textarea");
  for (const type of ["copy", "cut", "selectstart", "dragstart"]) {
    document.addEventListener(type, (e) => isField(e) || e.preventDefault());
  }
}

// 横スクロールの一覧は、マウスホイールの縦回転でも動かせるようにする
function wheelScrollGifts() {
  document.addEventListener(
    "wheel",
    (e) => {
      const list = e.target instanceof Element && e.target.closest(".gifts");
      if (list && list.scrollWidth > list.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        list.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

export function initEvents() {
  document.addEventListener("click", onClick);
  document.addEventListener("input", (e) => e.target.matches(".dd-q") && filterDropdown(e.target));

  // インポートは <label> なので、ほかのボタンと同じようにキーボード (Enter / Space) でも開けるようにする
  document.addEventListener("keydown", (e) => {
    const label = e.target instanceof Element && e.target.matches("label.menu-item") ? e.target : null;
    if (!label || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    label.querySelector("input")?.click();
  });

  // 画像がない生徒は、アイコンを出さず名前だけにする (error は伝播しないので capture で受ける)
  document.addEventListener("error", (e) => (e.target.classList?.contains("dd-icon") || e.target.classList?.contains("bond-icon")) && e.target.remove(), true);

  $("#menu-btn").innerHTML = icon("menu");
  $("#menu-btn").addEventListener("click", () => {
    renderMenuBody();
    $("#menu").showModal();
  });
  closeOnOutsideClick($("#menu"));
  closeOnOutsideClick($("#confirm"));

  const NAV_ICONS = { timer: "timer", calendar: "calendar", bond: "heart" };
  for (const b of document.querySelectorAll("nav button")) b.innerHTML = icon(NAV_ICONS[b.dataset.tab], 28);
  document.querySelector("nav").addEventListener("click", onNavClick);

  blockCopying();
  wheelScrollGifts();
}

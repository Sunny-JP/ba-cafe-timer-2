// data-act="..." のボタンごとの処理。クリックの委譲 (events.js) から呼ばれる。
import { logout } from "./auth.js";
import { disablePush, enablePush, pushEnabled } from "./push.js";
import { setLang, t } from "./i18n.js";
import { log } from "./log.js";
import { nextMonth, prevMonth } from "./time.js";
import { DEFAULT_ACCENT } from "../screens/views.js";
import { DEMO, state, store } from "./state.js";
import { saveCalendarImage } from "../screens/calendar-image.js";
import { deleteBond, selectBondChar } from "./bond.js";
import { loadCalendar, saveProfile } from "./data.js";
import { loadDoc } from "../screens/doc.js";
import { closeDropdowns, toggleDropdown } from "../screens/dropdown.js";
import { guarded } from "./guard.js";
import { reloadLoginDoc, renderLoginLang } from "../screens/login-screen.js";
import { render } from "../screens/render.js";
import { setAccent, setMode, applyTheme, isDark } from "../screens/theme.js";
import { withPending, recordTap } from "./taps.js";
import { deleteAccount, exportData } from "./transfer.js";
import { $, confirmDialog, toast } from "../screens/ui.js";

// 選んだ言語の文字列を追加でダウンロードしてから切り替える。取得できなければ今の言語のまま
async function changeLanguage(code) {
  log.info("lang", `switching language to ${code}`);
  try {
    await setLang(code, !DEMO);
  } catch (e) {
    log.error("lang", `failed to load language ${code}`, e);
    toast(t("langLoadFailed"));
    return;
  }
  applyTheme();
  renderLoginLang();
  reloadLoginDoc();
  (state.tab === "doc" ? loadDoc(state.doc) : Promise.resolve(null)).then((html) => {
    if (html !== null) state.docHtml = html;
    if (state.user) render(); // ログイン前は描画する画面がない
  });
}

// ドロップダウンの項目を選んだとき
const PICKERS = {
  char: selectBondChar,
  "cal-ym": (value) => !DEMO && value !== state.calMonth && loadCalendar(value),
  tz: (value) => !DEMO && saveProfile({ timezone: value || null }),
  lang: changeLanguage,
};

// 画面を切り替える (メニューを閉じ、先頭へ戻す)
function openTab(tab, { closeMenu = false, top = false } = {}) {
  if (closeMenu) $("#menu").close();
  state.tab = tab;
  render(true);
  if (top) scrollTo(0, 0);
}

export const actions = {
  tap: () => withPending("tap", recordTap),
  // お知らせを押すと、更新情報 (運営者情報の変更履歴) のページを開き、この更新のお知らせは消す
  async "notice-open"() {
    if (state.notice) store.set("seenUpdate", state.notice.id);
    state.notice = null;
    state.doc = "operator";
    state.docHtml = await loadDoc(state.doc);
    openTab("doc", { top: true });
    document.querySelector("#view ul.log")?.scrollIntoView({ block: "start" });
  },
  "ticket-use": (b) => withPending(`ticket${b.dataset.n}`, () => saveProfile({ [`ticket${b.dataset.n}_time`]: new Date().toISOString() })),
  "dd-toggle": toggleDropdown,
  "dd-pick"(b) {
    closeDropdowns();
    return PICKERS[b.dataset.field]?.(b.dataset.value);
  },
  "gifts-scroll"(b) {
    const list = b.parentElement.querySelector(".gifts");
    list.scrollBy({ left: Number(b.dataset.dir) * list.clientWidth * 0.8, behavior: "smooth" });
  },
  "save-image": saveCalendarImage,
  "theme-toggle"() {
    setMode(isDark() ? "light" : "dark");
    render();
  },
  "export-data": () => withPending("export-data", exportData),
  "cal-today": () => state.calMonth !== state.calMaxMonth && loadCalendar(state.calMaxMonth),
  "cal-prev": () => loadCalendar(prevMonth(state.calMonth)),
  "cal-next": () => loadCalendar(nextMonth(state.calMonth)),
  day(b) {
    state.selectedDay = b.dataset.day;
    render();
  },
  "bond-del": (b) => deleteBond(b.dataset.id),
  push: () =>
    withPending("push", () =>
      guarded(async () => {
        if (state.pushOn) await disablePush();
        else await enablePush();
        state.pushOn = pushEnabled();
      }),
    ),
  async doc(b) {
    state.doc = b.dataset.doc;
    state.docHtml = await loadDoc(state.doc);
    openTab("doc", { closeMenu: true, top: true });
  },
  mode(b) {
    setMode(b.dataset.mode);
    render();
  },
  home() {
    if (state.tab === "timer") return scrollTo(0, 0);
    openTab("timer", { top: true });
  },
  settings: () => openTab("settings", { closeMenu: true }),
  "accent-reset"() {
    setAccent(DEFAULT_ACCENT);
    render();
  },
  async logout() {
    if (await confirmDialog(t("confirmLogout"), t("logout"))) return logout();
  },
  "delete-account": deleteAccount,
};

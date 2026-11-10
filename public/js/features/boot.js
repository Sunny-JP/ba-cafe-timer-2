// 起動処理: デモ画面 / 通常のアプリ (ログイン状態の監視と、保存データの先行表示)。
import { onUser, preloadGsi } from "./auth.js";
import { setLang } from "./i18n.js";
import { showForegroundNotifications } from "./push.js";
import { clearGameDataCache } from "./gamedata.js";
import { log } from "./log.js";
import { state, store } from "./state.js";
import { applyBoot, clearUserCaches, loadBootCache, primeBond } from "./cache.js";
import { loadAll, resetUserData } from "./data.js";
import { loadDoc } from "../screens/doc.js";
import { render, renderMenuBody } from "../screens/render.js";
import { applyTheme } from "../screens/theme.js";
import { flushPendingTaps } from "./taps.js";
import { $, show } from "../screens/ui.js";

export async function startDemo() {
  const { applyDemo, demoLang } = __DEMO_BUILD__ ? await import("./demo.js") : {};
  // タイトル (Cafe Timer 2) は、本物のアプリへ戻るボタンにする
  $("#home-btn").addEventListener("click", () => location.assign("/"));
  // ログインも通信もせず、見本のデータで画面を出す
  if (demoLang) await setLang(demoLang, false);
  applyDemo(state);
  applyTheme();
  show("app");
  if (state.tab === "doc") state.docHtml = await loadDoc(state.doc);
  render();
  if (new URLSearchParams(location.search).get("menu")) {
    renderMenuBody();
    $("#menu").showModal();
  }
}

// ログアウト(失効を含む)したときの後始末と、ログイン画面の表示
function onSignedOut() {
  clearGameDataCache();
  clearUserCaches();
  store.set("uid", "");
  Object.assign(state, { relationship: [], bondReady: false, deferredLoading: false });
  show("login");
  preloadGsi(); // ログイン後の Drive 連携ですぐ使えるように
}

export function startApp() {
  // 前回ログインしたユーザーの保存データがあれば、認証の確定 (数百ms〜1秒) を待たずに先に描画する。
  // 認証が別の結果になったとき (ログアウト済み・別ユーザー) は、下の onUser で切り替える。
  const hintUid = store.get("uid", "", null);
  let primed = false;
  const hintCache = hintUid && loadBootCache(hintUid);
  if (hintCache) {
    applyBoot(hintCache);
    primeBond(hintUid);
    state.user = { uid: hintUid };
    primed = true;
    show("app");
    render();
  }

  onUser((user) => {
    log.info("auth", `auth state changed uid=${user?.uid ?? "none"} primed=${primed} hintUid=${hintUid ?? "none"}`);
    if (primed && user?.uid !== hintUid) {
      resetUserData(); // 先に出していたのは別のユーザー (またはログアウト済み) のデータ
      primed = false;
    }
    state.user = user;
    if (!user) return onSignedOut();
    store.set("uid", user.uid);
    show("app");
    if (!primed) {
      const cached = loadBootCache(user.uid);
      if (cached) applyBoot(cached);
      primeBond(user.uid);
      state.loading = !cached;
      render();
    }
    // 通知の受信設定 (firebase-messaging の読み込みを含む) は、画面が出たあとの空き時間に行う
    (window.requestIdleCallback ?? setTimeout)(() => showForegroundNotifications().catch(() => {}));
    flushPendingTaps()
      .then(loadAll)
      .finally(() => {
        // 取得に失敗した場合も、読み込み表示のまま止まらないようにする
        state.loading = false;
        render();
      });
  });
}

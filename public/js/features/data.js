// サーバーからのデータ読み込みと、プロフィールの保存。
import { api } from "./api.js";
import { ensureGameData } from "./gamedata.js";
import { log } from "./log.js";
import { logicalMonth } from "./time.js";
import { emptyProfile, state } from "./state.js";
import { initBondChar, saveBootCache, saveRelCache } from "./cache.js";
import { guarded, link } from "./guard.js";
import { flush, latestWithQueued, queueProfile, withQueuedProfile, withQueuedTaps } from "./outbox.js";
import { render } from "../screens/render.js";

// 読み込んだタイマーのデータを画面に反映する。まだサーバーに届いていない操作 (outbox.js) は重ねて表示する
let loadedAt = 0;
function applyBootstrap(data, { keepCalendar = false } = {}) {
  const taps = withQueuedTaps(data.month, data.taps);
  Object.assign(state, {
    profile: withQueuedProfile(data.profile),
    lastTap: latestWithQueued(data.last_tap),
    monthTaps: taps,
    loading: false,
  });
  // 読み直しでは、ほかの月のカレンダーを見ていたらそのままにする
  if (!keepCalendar || state.calMonth === data.month) Object.assign(state, { calMonth: data.month, calTaps: taps });
  loadedAt = Date.now();
  saveBootCache();
  render();
}

// タイマー(と当月のカレンダー)に要る分だけ先に読んで表示し、絆とゲームデータは続けて裏で読む
export async function loadAll() {
  log.info("load", "bootstrap: request start");
  const data = await guarded(() => api.bootstrap(logicalMonth(Date.now())));
  log.info("load", data ? "bootstrap: done" : "bootstrap: failed");
  link.auto = false; // 連携済みだった場合は、あとで自動では開かない
  if (!data) return;
  applyBootstrap(data);
  loadDeferred();
}

// 裏での読み直し (画面が前面に戻ったとき・別の端末の記録と食い違ったとき)。別の端末で記録された分を反映し、
// 古い画面のまま二重に押されるのを防ぐ。失敗しても知らせない (オフラインで開き直すたびにエラーを出さない)
export async function refresh(force = false) {
  if (!state.user || state.loading || (!force && Date.now() - loadedAt < 30000)) return;
  log.info("load", `refresh (force=${force})`);
  try {
    const [data, rel] = await Promise.all([
      api.bootstrap(logicalMonth(Date.now())),
      state.bondReady ? api.relationship() : null,
    ]);
    applyBootstrap(data, { keepCalendar: true });
    if (rel) {
      state.relationship = rel.relationship;
      saveRelCache();
      render();
    }
  } catch (e) {
    log.warn("load", "refresh failed", e);
  }
}

// 絆の記録・EXP表・キャラ・贈物。サーバーから取得し、保存済みのゲームデータがあればすぐ使う (js/gamedata.js)
export async function loadDeferred() {
  state.deferredLoading = true;
  const rel = await guarded(async () => {
    const [r] = await Promise.all([api.relationship(), ensureGameData({ onUpdate: () => render() })]);
    return r;
  });
  state.deferredLoading = false;
  log.info("load", rel ? "relationship/gamedata: done" : "relationship/gamedata: failed");
  if (!rel) return;
  state.relationship = rel.relationship;
  initBondChar();
  state.bondReady = true;
  saveRelCache();
  render();
}

export async function loadCalendar(month) {
  state.calMonth = month;
  state.selectedDay = null;
  state.calLoading = true;
  render(true);
  const data = await guarded(() => api.taps(month));
  state.calLoading = false;
  if (data && data.month === state.calMonth) state.calTaps = withQueuedTaps(data.month, data.taps);
  render();
}

// 端末に保存して画面に反映し、完了とする。サーバーへは outbox.js が裏で送る (届くまで送り直す)
export function saveProfile(patch) {
  log.info("profile", "saveProfile: saved to device, patch ->", patch);
  queueProfile(patch);
  state.profile = { ...state.profile, ...patch };
  saveBootCache();
  render();
  flush();
}

// 別のユーザー (またはログアウト済み) のデータを画面に残さない
export function resetUserData() {
  Object.assign(state, {
    profile: emptyProfile(),
    lastTap: null,
    monthTaps: [],
    calTaps: [],
    relationship: [],
    bondReady: false,
    deferredLoading: false,
    selectedDay: null,
  });
}

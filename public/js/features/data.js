// サーバーからのデータ読み込みと、プロフィールの保存。
import { api } from "./api.js";
import { ensureGameData } from "./gamedata.js";
import { log } from "./log.js";
import { logicalMonth } from "./time.js";
import { emptyProfile, state } from "./state.js";
import { initBondChar, saveBootCache, saveRelCache } from "./cache.js";
import { guarded, link } from "./guard.js";
import { render } from "../screens/render.js";

// タイマー(と当月のカレンダー)に要る分だけ先に読んで表示し、絆とゲームデータは続けて裏で読む
export async function loadAll() {
  log.info("load", "bootstrap: request start");
  const data = await guarded(() => api.bootstrap(logicalMonth(Date.now())));
  log.info("load", data ? "bootstrap: done" : "bootstrap: failed");
  link.auto = false; // 連携済みだった場合は、あとで自動では開かない
  if (!data) return;
  Object.assign(state, {
    profile: data.profile,
    lastTap: data.last_tap,
    monthTaps: data.taps,
    calMonth: data.month,
    calTaps: data.taps,
    loading: false,
  });
  saveBootCache();
  render();
  loadDeferred();
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
  if (data && data.month === state.calMonth) state.calTaps = data.taps;
  render();
}

// 楽観的に反映してから保存し、失敗した項目だけ元に戻す
export async function saveProfile(patch) {
  const before = state.profile;
  log.info("profile", "saveProfile: start (optimistic update applied), patch ->", patch);
  state.profile = { ...before, ...patch };
  render();
  const data = await guarded(() => api.saveProfile(patch));
  log.info("profile", data ? "saveProfile: success, patch ->" : "saveProfile: failed, rolling back, patch ->", patch);
  if (data) {
    // 応答の profile 全体では、並行して行った別の更新(楽観的に反映済み)を巻き戻すことがある。送った項目だけ反映する
    const saved = {};
    for (const k of Object.keys(patch)) saved[k] = data.profile[k];
    state.profile = { ...state.profile, ...saved, updated_at: data.profile.updated_at };
  } else {
    const undone = {};
    for (const k of Object.keys(patch)) undone[k] = before[k];
    state.profile = { ...state.profile, ...undone };
  }
  saveBootCache();
  render();
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

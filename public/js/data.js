// データの読み込みと記録 (タップ・プロフィール・絆)、書き出し・取り込み・アカウント削除
import { ReauthRequired, api, log, logout, requestDriveCode, setVerbose } from "./api.js";
import { ensureGameData, hasGameData } from "./gamedata.js";
import { t } from "./i18n.js";
import { discardOutbox, flush, latestWithQueued, queueProfile, queueTap, withQueuedProfile, withQueuedTaps } from "./outbox.js";
import { logicalMonth, nextTapTime, shouldScheduleNotification, uuidv7 } from "./time.js";
import { initBondChar, loadRelCache, saveBootCache, saveRelCache, state, store } from "./state.js";
import { $, busy, confirmDialog, downloadBlob, render, renderCalendarArea, showReauth, toTimerScreen, toast, withBusy } from "./ui.js";

// ---- エラー処理 ----

// ログイン直後に Drive が未連携なら、バナーを出さずにそのまま認可画面を開く
export const link = { auto: false };

// 失敗したらトースト (Drive の再認証が必要ならバナー) で知らせて undefined を返す
export async function guarded(operation) {
  try {
    return await operation();
  } catch (error) {
    log.error("guarded", `${error?.name} status=${error?.status ?? "-"}`, error);
    if (!(error instanceof ReauthRequired)) return void toast(error.message);
    if (link.auto) {
      link.auto = false;
      try {
        await api.linkDrive(await requestDriveCode());
        $("#reauth").hidden = true;
        return await guarded(operation);
      } catch {}
    }
    showReauth();
  }
}

// ボタンを処理中表示にして実行する。処理中の連打は無視する
export async function withPending(buttonKey, operation) {
  if (state.pending.has(buttonKey)) return;
  state.pending.add(buttonKey);
  render();
  try {
    await operation();
  } finally {
    state.pending.delete(buttonKey);
    render();
  }
}

// ---- 読み込み ----

let loadedAt = 0;
const monthCache = new Map(); // このセッションで読んだ月のタップ (カレンダー用)

// サーバーのデータに、まだ送れていない操作を重ねて表示する
function applyBootstrap(data, { keepCalendar = false } = {}) {
  setVerbose(!!data.is_admin);
  const taps = withQueuedTaps(data.month, data.taps);
  Object.assign(state, {
    profile: withQueuedProfile(data.profile),
    lastTap: latestWithQueued(data.last_tap),
    monthTaps: taps,
    loading: false,
  });
  if (!keepCalendar || state.calMonth === data.month) Object.assign(state, { calMonth: data.month, calTaps: taps });
  loadedAt = Date.now();
  saveBootCache();
  render();
}

// タイマーの分を先に表示し、絆とゲームデータは続けて裏で読む
export async function loadAll() {
  const data = await guarded(() => api.bootstrap(logicalMonth(Date.now())));
  link.auto = false;
  if (!data) return;
  applyBootstrap(data);
  loadDeferred();
}

// 前面に戻ったとき (30 秒以内は省略)・別の端末の記録と食い違ったときの読み直し。失敗しても知らせない
export async function refresh(force = false) {
  if (!state.user || state.loading || (!force && Date.now() - loadedAt < 30000)) return;
  try {
    const [data, bonds] = await Promise.all([api.bootstrap(logicalMonth(Date.now())), state.bondReady ? api.relationship() : null]);
    applyBootstrap(data, { keepCalendar: true });
    if (bonds) {
      state.relationship = bonds.relationship;
      saveRelCache();
      render();
    }
  } catch (error) {
    log.warn("load", "refresh failed", error);
  }
}

export async function loadDeferred() {
  state.deferredLoading = true;
  const bonds = await guarded(async () => (await Promise.all([api.relationship(), ensureGameData({ onUpdate: render })]))[0]);
  state.deferredLoading = false;
  if (!bonds) return;
  state.relationship = bonds.relationship;
  initBondChar();
  state.bondReady = true;
  saveRelCache();
  render();
}

// 端末に保存した絆の記録とゲームデータで、絆タブを待たずに開けるようにする
export function primeBond(uid) {
  const relationship = loadRelCache(uid);
  if (!relationship || !hasGameData()) return;
  ensureGameData({ onUpdate: render }).catch(() => {});
  state.relationship = relationship;
  initBondChar();
  state.bondReady = true;
}

// カレンダーの月の切り替え。カレンダー部分だけを描き直す。当月は通信せず、一度見た月はすぐ出してから取り直す
export async function loadCalendar(month) {
  state.calMonth = month;
  state.selectedDay = null;
  if (month === logicalMonth(Date.now())) {
    Object.assign(state, { calTaps: state.monthTaps, calLoading: false });
    return renderCalendarArea();
  }
  const cached = monthCache.get(month);
  Object.assign(state, { calTaps: cached ? withQueuedTaps(month, cached) : [], calLoading: !cached });
  renderCalendarArea();
  const data = await guarded(() => api.taps(month));
  if (state.calMonth !== month) return;
  state.calLoading = false;
  if (data) {
    monthCache.set(month, data.taps);
    state.calTaps = withQueuedTaps(month, data.taps);
  }
  renderCalendarArea();
}

export function selectDay(day) {
  state.selectedDay = day;
  renderCalendarArea();
}

export const clearCalendarCache = () => monthCache.clear();

// ---- 記録 (端末に保存して完了とし、サーバーへは outbox.js が送る) ----

export function recordTap() {
  const now = Date.now();
  if (state.lastTap && now < nextTapTime(Date.parse(state.lastTap.tap_time))) return;
  const tap = { id: uuidv7(now), tap_time: new Date(now).toISOString() };
  queueTap(tap);
  state.lastTap = tap;
  state.monthTaps = [...state.monthTaps, tap];
  if (state.calMonth === logicalMonth(now)) state.calTaps = state.monthTaps;
  saveBootCache();
  render();
  if (state.pushOn && !shouldScheduleNotification(now)) toast(t("noPushSchedule"));
  flush();
}

export function saveProfile(patch) {
  queueProfile(patch);
  state.profile = { ...state.profile, ...patch };
  saveBootCache();
  render();
  flush();
}

// ---- 絆 ----

export function selectBondChar(charKey) {
  state.bondChar = charKey;
  state.bondLevel = null;
  store.set("char", charKey);
  render();
}

// 描き直すと入力中の値が消えるので、送信中はボタンだけを無効にする
export async function submitBond(form) {
  const fields = new FormData(form);
  const bond = { char_key: state.bondChar, bond_level: Number(fields.get("bond_level")), recorded_at: fields.get("recorded_at") };
  const button = form.querySelector(".record");
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("busy");
  let data;
  try {
    data = await guarded(() => api.addBond(bond));
  } finally {
    button.disabled = false;
    button.classList.remove("busy");
  }
  if (!data) return;
  state.relationship = [...state.relationship, data.item];
  state.bondLevel = null;
  state.bondDate = bond.recorded_at;
  saveRelCache();
  render();
}

export async function deleteBond(id) {
  if (!(await confirmDialog(t("confirmDelBond"), t("del"), true))) return;
  const deleted = await withBusy(t("deleting"), 1, () => guarded(() => api.deleteBond(id)));
  if (!deleted) return;
  state.relationship = state.relationship.filter((item) => item.id !== id);
  state.bondLevel = null;
  saveRelCache();
  render();
}

// ---- 書き出し・取り込み・削除 ----

export async function exportData() {
  const data = await withBusy(t("exporting"), 1, () => guarded(() => api.exportData()));
  if (!data) return;
  const fileName = `cafetimer-export-${new Date().toISOString().slice(0, 10)}.json`;
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), fileName);
  toast(t("exported", { taps: data.taps.length, bonds: data.relationship.length }));
}

export async function importFile(file) {
  toTimerScreen();
  busy.show(t("importReading"), 0);
  try {
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return toast(t("badJson"));
    }
    busy.show(t("importSending", { taps: parsed?.taps?.length ?? 0, bonds: parsed?.relationship?.length ?? 0 }), 1);
    const result = await guarded(() => api.importData(parsed));
    if (!result) return;
    monthCache.clear();
    busy.show(t("importRefresh"), 2);
    await loadAll();
    toast(t("imported", { taps: result.taps, bonds: result.relationship, skipped: result.skipped }));
  } finally {
    busy.hide();
  }
}

export async function deleteAccount() {
  if (!(await confirmDialog(t("confirmDelAccount"), t("del"), true))) return;
  toTimerScreen();
  const deleted = await withBusy(t("deletingAccount"), 0, () => guarded(() => api.deleteAccount()));
  if (!deleted) return;
  discardOutbox();
  toast(t("deleted"));
  await logout();
}

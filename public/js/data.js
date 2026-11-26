import { ReauthRequired, api, log, logout, requestDriveCode, setVerbose } from "./api.js";
import { ensureGameData, hasGameData } from "./gamedata.js";
import { t } from "./i18n.js";
import { discardOutbox, flush, latestWithQueued, queueProfile, queueTap, withQueuedProfile, withQueuedTaps } from "./outbox.js";
import { disablePush, pushEnabled } from "./push.js";
import { logicalMonth, nextTapTime, shouldScheduleNotification, uuidv7 } from "./time.js";
import { initBondChar, loadRelCache, saveBootCache, saveRelCache, state, store } from "./state.js";
import { $, busy, confirmDialog, downloadBlob, render, renderCalendarArea, showAds, showReauth, toTimerScreen, toast, withBusy } from "./ui.js";

export const link = { auto: false };

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

let loadedAt = 0;
const monthCache = new Map();

function applyBootstrap(data, { keepCalendar = false } = {}) {
  setVerbose(!!data.is_admin);
  const taps = withQueuedTaps(data.month, data.taps);
  Object.assign(state, {
    profile: withQueuedProfile(data.profile),
    lastTap: latestWithQueued(data.last_tap),
    monthTaps: taps,
    adsEnabled: data.ads === true,
    loading: false,
  });
  store.set("ads", state.adsEnabled ? "1" : "");
  if (!keepCalendar || state.calMonth === data.month) Object.assign(state, { calMonth: data.month, calTaps: taps });
  loadedAt = Date.now();
  saveBootCache();
  render();
}

async function whileSyncing(task) {
  state.syncing = true;
  render();
  try {
    return await task();
  } finally {
    state.syncing = false;
    render();
  }
}

const RELOAD_WINDOW = 30000;
const RELOAD_LIMIT = 10;
let loadAllowedAt = 0;
export function reloadWaitMs(now = Date.now()) {
  const stored = store.json("reloads");
  const recent = [...(Array.isArray(stored) ? stored : []).filter((time) => now - time < RELOAD_WINDOW), now];
  store.set("reloads", JSON.stringify(recent.slice(-RELOAD_LIMIT - 1)));
  const waitMs = recent.length > RELOAD_LIMIT ? recent[recent.length - 1 - RELOAD_LIMIT] + RELOAD_WINDOW - now : 0;
  loadAllowedAt = now + waitMs;
  return waitMs;
}

export async function loadAll() {
  const uid = state.user?.uid;
  const bonds = api.relationship();
  bonds.catch(() => {});
  const data = await whileSyncing(() => guarded(() => api.bootstrap(logicalMonth(Date.now()))));
  link.auto = false;
  if (!data || state.user?.uid !== uid) return;
  applyBootstrap(data);
  loadDeferred(bonds);
}

export async function refresh(force = false) {
  if (!state.user || state.loading || Date.now() < loadAllowedAt || (!force && Date.now() - loadedAt < 30000)) return;
  try {
    const [data, bonds] = await whileSyncing(() => Promise.all([api.bootstrap(logicalMonth(Date.now())), state.bondReady ? api.relationship() : null]));
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

export async function loadAds() {
  if (state.ads || !state.adsEnabled) return;
  try {
    const response = await fetch("/api/ads");
    if (!response.ok) throw new Error(`ads ${response.status}`);
    state.ads = (await response.json()).items ?? [];
    showAds();
  } catch (error) {
    log.warn("ads", "load failed", error);
  }
}

export async function loadDeferred(prefetched) {
  state.deferredLoading = true;
  const bonds = await guarded(async () => {
    const relationship = prefetched ? prefetched.catch(() => api.relationship()) : api.relationship();
    prefetched = null;
    return (await Promise.all([relationship, ensureGameData({ onUpdate: render })]))[0];
  });
  state.deferredLoading = false;
  if (!bonds) return;
  state.relationship = bonds.relationship;
  initBondChar();
  state.bondReady = true;
  saveRelCache();
  render();
}

export function primeBond(uid) {
  const relationship = loadRelCache(uid);
  if (!relationship || !hasGameData()) return;
  ensureGameData({ onUpdate: render }).catch(() => {});
  state.relationship = relationship;
  initBondChar();
  state.bondReady = true;
}

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

export function selectBondChar(charKey) {
  state.bondChar = charKey;
  state.bondLevel = null;
  store.set("char", charKey);
  render();
}

// 描き直すと入力中の値が消えるので、ボタンだけを無効にする
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

async function fetchExport() {
  let { next, ...data } = await api.exportData();
  while (next) {
    const page = await api.exportData(next);
    data.taps.push(...page.taps);
    next = page.next;
  }
  return data;
}

export async function exportData() {
  const data = await withBusy(t("exporting"), 1, () => guarded(fetchExport));
  if (!data) return;
  const fileName = `cafetimer-export-${new Date().toISOString().slice(0, 10)}.json`;
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), fileName);
  toast(t("exported", { taps: data.taps.length, bonds: data.relationship.length }));
}

// サーバーが 1 回で受け付けるのは 12 か月分まで
function splitImport(data) {
  if (!Array.isArray(data?.taps)) return [data];
  const months = new Map();
  for (const tap of data.taps) {
    const time = Date.parse(tap?.tap_time);
    const month = Number.isFinite(time) ? logicalMonth(time) : "";
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(tap);
  }
  const groups = [...months.values()];
  const parts = [{ ...data, taps: groups.slice(0, 12).flat() }];
  for (let start = 12; start < groups.length; start += 12) parts.push({ taps: groups.slice(start, start + 12).flat() });
  return parts;
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
    const result = { taps: 0, relationship: 0, skipped: 0 };
    for (const [index, part] of splitImport(parsed).entries()) {
      const partResult = await guarded(() => api.importData(part));
      if (!partResult) return void (index && (await loadAll()));
      for (const key of Object.keys(result)) result[key] += partResult[key];
    }
    monthCache.clear();
    busy.show(t("importRefresh"), 2);
    await loadAll();
    toast(t("imported", { taps: result.taps, bonds: result.relationship, skipped: result.skipped }));
  } finally {
    busy.hide();
  }
}

// 共有端末で次の人に通知が届かないよう、登録を解除してからログアウトする
export async function logoutDevice() {
  if (pushEnabled()) await disablePush().catch((error) => log.warn("push", "unregister failed", error));
  state.pushOn = false;
  await logout();
}

export async function deleteAccount() {
  if (!(await confirmDialog(t("confirmDelAccount"), t("del"), true))) return;
  toTimerScreen();
  const deleted = await withBusy(t("deletingAccount"), 0, () => guarded(async () => {
    while ((await api.deleteAccount()).done === false);
    return true;
  }));
  if (!deleted) return;
  discardOutbox();
  toast(t("deleted"));
  await logoutDevice();
}

// 送信待ちの書き込み (タップ・プロフィール)。端末に保存して完了とし、サーバーへは裏で届くまで送る。
// タップは端末で決めた ID で送り、サーバーは同じ ID を二重に記録しないので、送り直しても安全
import { ApiError, ReauthRequired, api, getIdToken, log } from "./api.js";
import { refresh } from "./data.js";
import { t } from "./i18n.js";
import { logicalMonth } from "./time.js";
import { DEMO, saveBootCache, state, store } from "./state.js";
import { render, showReauth, toast } from "./ui.js";

const storageKey = (uid) => `outbox.${uid}`;
const byTapTime = (first, second) => (first.tap_time < second.tap_time ? -1 : first.tap_time > second.tap_time ? 1 : 0);
const latestTap = (taps, initial = null) => taps.reduce((latest, tap) => (!latest || tap.tap_time > latest.tap_time ? tap : latest), initial);

export function loadOutbox(uid = state.user?.uid) {
  const saved = uid ? store.json(storageKey(uid)) : null;
  return {
    taps: Array.isArray(saved?.taps) ? saved.taps : [],
    profile: saved?.profile && typeof saved.profile === "object" ? saved.profile : {},
  };
}

function saveOutbox(outbox) {
  if (!state.user) return;
  store.set(storageKey(state.user.uid), JSON.stringify(outbox));
  mirrorToWorker(outbox);
  updateSyncIcon();
}

export const hasOutbox = (outbox = loadOutbox()) => outbox.taps.length > 0 || Object.keys(outbox.profile).length > 0;

// 旧版の ct.pendingTaps を取り込む
function migrateLegacyTaps() {
  const legacy = store.json("pendingTaps");
  if (!Array.isArray(legacy) || !legacy.length) return;
  const outbox = loadOutbox();
  const knownIds = new Set(outbox.taps.map((tap) => tap.id));
  outbox.taps.push(...legacy.filter((tap) => tap?.id && tap?.tap_time && !knownIds.has(tap.id)));
  saveOutbox(outbox);
  store.set("pendingTaps", "[]");
}

export function queueTap(tap) {
  const outbox = loadOutbox();
  outbox.taps.push(tap);
  saveOutbox(outbox);
}

export function queueProfile(patch) {
  const outbox = loadOutbox();
  outbox.profile = { ...outbox.profile, ...patch };
  saveOutbox(outbox);
}

export function discardOutbox() {
  clearTimeout(retryTimer);
  saveOutbox({ taps: [], profile: {} });
}

// ---- サーバーから読んだデータに、まだ届いていない分を重ねる ----

export function withQueuedTaps(month, taps) {
  const knownIds = new Set(taps.map((tap) => tap.id));
  const queued = loadOutbox().taps.filter((tap) => !knownIds.has(tap.id) && logicalMonth(Date.parse(tap.tap_time)) === month);
  return queued.length ? [...taps, ...queued].sort(byTapTime) : taps;
}

export const latestWithQueued = (lastTap) => latestTap(loadOutbox().taps, lastTap ?? null);
export const withQueuedProfile = (profile) => ({ ...profile, ...loadOutbox().profile });

// ---- ヘッダーの同期アイコン (送信中・再送待ち) ----

const syncStatus = { sending: false, waiting: false };

function updateSyncIcon() {
  const icon = document.getElementById("sync");
  if (!icon) return;
  const queued = state.user && !DEMO && hasOutbox();
  const waiting = !!queued && syncStatus.waiting && !syncStatus.sending;
  icon.hidden = !queued;
  icon.classList.toggle("waiting", waiting);
  icon.title = t(waiting ? "syncWaiting" : "syncing");
  icon.setAttribute("aria-label", icon.title);
}

// ---- 送信 ----

let running = null;
let retryTimer = 0;
let retryCount = 0;
const RETRY_DELAYS = [2000, 5000, 15000, 30000, 60000];

function scheduleRetry() {
  clearTimeout(retryTimer);
  const delay = RETRY_DELAYS[Math.min(retryCount++, RETRY_DELAYS.length - 1)];
  log.info("outbox", `retry in ${delay}ms`);
  retryTimer = setTimeout(flush, delay);
}

// 内容が不正なもの (4xx) は捨てる。認証・タイムアウト・回数制限は送り直す
const isPermanentError = (error) => error instanceof ApiError && error.status >= 400 && error.status < 500 && ![401, 408, 429].includes(error.status);

function notifyRejected(error) {
  toast(error.code === "conflict" ? t("recordedElsewhere") : error.message);
  refresh(true);
}

// サーバーの結果を画面に反映する (受け付けられたら置き換え、拒否されたら取り除く)
function applyTapResult(tap, accepted) {
  const update = (taps) => (accepted ? taps.map((item) => (item.id === tap.id ? tap : item)) : taps.filter((item) => item.id !== tap.id));
  state.monthTaps = update(state.monthTaps);
  state.calTaps = update(state.calTaps);
  if (state.lastTap?.id === tap.id) state.lastTap = accepted ? tap : latestTap(state.monthTaps);
}

async function sendTap(tap) {
  try {
    applyTapResult((await api.tap(tap)).tap, true);
  } catch (error) {
    if (!isPermanentError(error)) throw error;
    log.warn("outbox", `tap rejected (${error.status} ${error.code ?? ""})`);
    applyTapResult(tap, false);
    notifyRejected(error);
  }
  const outbox = loadOutbox();
  outbox.taps = outbox.taps.filter((item) => item.id !== tap.id);
  saveOutbox(outbox);
}

// 送っている間に同じ項目がさらに変わっていたら、その分は残して次に送る
async function sendProfile(patch) {
  let data = null;
  try {
    data = await api.saveProfile(patch);
  } catch (error) {
    if (!isPermanentError(error)) throw error;
    log.warn("outbox", `profile rejected (${error.status})`);
    notifyRejected(error);
  }
  const outbox = loadOutbox();
  for (const field of Object.keys(patch)) if (outbox.profile[field] === patch[field]) delete outbox.profile[field];
  saveOutbox(outbox);
  if (!data) return;
  const saved = { updated_at: data.profile.updated_at };
  for (const field of Object.keys(patch)) if (!(field in outbox.profile)) saved[field] = data.profile[field];
  state.profile = { ...state.profile, ...saved };
  if (data.conflicts?.length) notifyRejected({ code: "conflict" });
}

// 1 件送る。続けてよければ true
async function sendNext() {
  const outbox = loadOutbox();
  if (outbox.taps.length) return sendTap(outbox.taps[0]).then(() => true);
  if (Object.keys(outbox.profile).length) return sendProfile(outbox.profile).then(() => true);
  return false;
}

async function sendAll() {
  await null;
  syncStatus.sending = true;
  updateSyncIcon();
  try {
    while (await sendNext()) {
      retryCount = 0;
      syncStatus.waiting = false;
      saveBootCache();
      render();
    }
  } catch (error) {
    log.warn("outbox", "send failed, will retry", error);
    syncStatus.waiting = true;
    if (error instanceof ReauthRequired) {
      if (document.getElementById("reauth")?.hidden !== false) toast(t("tapQueued"));
      showReauth();
    } else scheduleRetry();
  } finally {
    syncStatus.sending = false;
    running = null;
    updateSyncIcon();
  }
}

// 送信待ちを順に送る。送信中に呼ばれたら、今の送信が続けて拾う
export function flush() {
  if (DEMO || !state.user) return Promise.resolve();
  migrateLegacyTaps();
  if (!hasOutbox()) {
    updateSyncIcon();
    return Promise.resolve();
  }
  clearTimeout(retryTimer);
  running ??= sendAll();
  return running;
}

// ---- Service Worker (Background Sync) 用の写し ----
// Service Worker は localStorage を読めないので IndexedDB に写す。送るときの ID トークン (1 時間有効) も添える

const DB_NAME = "ct-outbox";
const STORE_NAME = "kv";

async function withDatabase(operation) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      operation(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

async function mirrorToWorker(outbox) {
  if (DEMO || !("indexedDB" in window)) return;
  try {
    if (!hasOutbox(outbox)) return await withDatabase((objectStore) => objectStore.delete("outbox"));
    const token = await getIdToken();
    await withDatabase((objectStore) => objectStore.put({ uid: state.user.uid, token, taps: outbox.taps, profile: outbox.profile }, "outbox"));
  } catch (error) {
    log.warn("outbox", "mirror to IndexedDB failed", error);
  }
}

// ログアウト時: ID トークンを含む写しを残さない
export function clearWorkerOutbox() {
  if (!DEMO && "indexedDB" in window) withDatabase((objectStore) => objectStore.delete("outbox")).catch(() => {});
}

async function registerBackgroundSync() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration && "sync" in registration) await registration.sync.register("ct-outbox");
  } catch (error) {
    log.warn("outbox", "background sync unavailable", error);
  }
}

// 送るタイミング: 通信が戻ったとき・前面に戻ったとき・画面が隠れるとき (送り切れない分は Background Sync に任せる)
export function initOutbox() {
  if (DEMO) return;
  addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") return flush();
    if (!hasOutbox()) return;
    flush();
    mirrorToWorker(loadOutbox()).then(registerBackgroundSync);
  });
  addEventListener("pagehide", () => hasOutbox() && flush());
}

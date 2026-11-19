// 送信待ちの書き込み (タップ・プロフィール)。押した時点で端末に保存して操作は完了とし、サーバーへは裏で送る。
// 送るタイミング:
//   1. 保存した直後 (keepalive 付きなので、送信を始めたあとにアプリを閉じても最後まで送られる)
//   2. 画面が隠れたとき (1 が始まる前に閉じられた分)。あわせて Background Sync を登録する (対応ブラウザのみ。
//      アプリを閉じていても、通信が戻ったときに Service Worker が送る。firebase-messaging-sw.js)
//   3. 次の起動時・通信が戻ったとき・画面が前面に戻ったとき・再認証のあと
// タップは端末で決めた ID で送り、サーバーは同じ ID を二重に記録しないので、何度送り直しても安全。
import { ReauthRequired, getIdToken } from "./auth.js";
import { ApiError, api } from "./api.js";
import { t } from "./i18n.js";
import { log } from "./log.js";
import { logicalMonth } from "./time.js";
import { DEMO, state, store } from "./state.js";
import { saveBootCache } from "./cache.js";
import { showReauth } from "./guard.js";
import { render } from "../screens/render.js";
import { toast } from "../screens/ui.js";

const key = (uid) => `outbox.${uid}`;
const byTime = (a, b) => (a.tap_time < b.tap_time ? -1 : a.tap_time > b.tap_time ? 1 : 0);

export function loadOutbox(uid = state.user?.uid) {
  const empty = { taps: [], profile: {} };
  if (!uid) return empty;
  try {
    const o = JSON.parse(store.get(key(uid), "", null) ?? "null");
    return {
      taps: Array.isArray(o?.taps) ? o.taps : [],
      profile: o?.profile && typeof o.profile === "object" ? o.profile : {},
    };
  } catch {
    return empty;
  }
}

function saveOutbox(o) {
  if (!state.user) return;
  store.set(key(state.user.uid), JSON.stringify(o));
  mirrorToWorker(o);
  updateSyncState();
}

export const hasOutbox = (o = loadOutbox()) => o.taps.length > 0 || Object.keys(o.profile).length > 0;

// 以前の版で、再認証待ちのときだけ端末に溜めていたタップ (ct.pendingTaps) を取り込む
function migrateLegacy() {
  let legacy = [];
  try {
    legacy = JSON.parse(store.get("pendingTaps", "[]"));
  } catch {
    /* 壊れていれば捨てる */
  }
  if (!Array.isArray(legacy) || !legacy.length) return;
  const o = loadOutbox();
  const ids = new Set(o.taps.map((x) => x.id));
  o.taps.push(...legacy.filter((x) => x?.id && x?.tap_time && !ids.has(x.id)));
  saveOutbox(o);
  store.set("pendingTaps", "[]");
}

// ---- 追加 ----

export function queueTap(tap) {
  const o = loadOutbox();
  o.taps.push(tap);
  saveOutbox(o);
}

export function queueProfile(patch) {
  const o = loadOutbox();
  o.profile = { ...o.profile, ...patch };
  saveOutbox(o);
}

// アカウント削除のあと: 未送信の記録を捨てる (Service Worker 用の写しも)
export function discardOutbox() {
  clearTimeout(retryTimer);
  saveOutbox({ taps: [], profile: {} });
}

// ---- サーバーから読んだデータに、まだ届いていない分を重ねる (読み込みで未送信のタップが消えないように) ----

export function withQueuedTaps(month, taps) {
  const ids = new Set(taps.map((x) => x.id));
  const extra = loadOutbox().taps.filter((x) => !ids.has(x.id) && logicalMonth(Date.parse(x.tap_time)) === month);
  return extra.length ? [...taps, ...extra].sort(byTime) : taps;
}

export function latestWithQueued(lastTap) {
  return loadOutbox().taps.reduce((a, x) => (!a || x.tap_time > a.tap_time ? x : a), lastTap ?? null);
}

export const withQueuedProfile = (profile) => ({ ...profile, ...loadOutbox().profile });

// ---- 同期中の表示 (ヘッダーの小さなアイコン) ----

const sync = { sending: false, waiting: false }; // waiting: 送れずに再送待ち (通信・認証)

function updateSyncState() {
  const el = document.getElementById("sync");
  if (!el) return;
  const queued = state.user && !DEMO && hasOutbox();
  el.hidden = !queued;
  el.classList.toggle("waiting", !!queued && sync.waiting && !sync.sending);
  el.title = t(sync.waiting && !sync.sending ? "syncWaiting" : "syncing");
  el.setAttribute("aria-label", el.title);
}

// ---- 送信 ----

// 別の端末の記録と食い違って拒否されたときに、最新のデータを読み直す (data.js の refresh。boot.js で設定)
let refreshNeeded = () => {};
export const onRefreshNeeded = (fn) => (refreshNeeded = fn);

function rejected(e) {
  toast(e.code === "conflict" ? t("recordedElsewhere") : e.message);
  refreshNeeded(true);
}

let running = null;
let retryTimer = 0;
let retryCount = 0;
const RETRY_DELAYS = [2000, 5000, 15000, 30000, 60000];

function scheduleRetry() {
  clearTimeout(retryTimer);
  const delay = RETRY_DELAYS[Math.min(retryCount++, RETRY_DELAYS.length - 1)];
  log.info("outbox", `retry in ${delay}ms`);
  retryTimer = setTimeout(() => flush(), delay);
}

// 通信や一時的な障害 (5xx・ネットワーク・認証) なら残して再送。内容が不正 (400・重複 429 など) なら諦めて捨てる
const isPermanent = (e) => e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 408;

function confirmTap(tap) {
  const swap = (list) => list.map((x) => (x.id === tap.id ? tap : x));
  state.monthTaps = swap(state.monthTaps);
  state.calTaps = swap(state.calTaps);
  if (state.lastTap?.id === tap.id) state.lastTap = tap;
}

function dropTap(tap) {
  const rest = (list) => list.filter((x) => x.id !== tap.id);
  state.monthTaps = rest(state.monthTaps);
  state.calTaps = rest(state.calTaps);
  if (state.lastTap?.id === tap.id) state.lastTap = state.monthTaps.reduce((a, x) => (!a || x.tap_time > a.tap_time ? x : a), null);
}

// 1件送る。続けてよければ true
async function sendOne() {
  const o = loadOutbox();
  if (o.taps.length) {
    const tap = o.taps[0];
    try {
      const data = await api.tap(tap);
      log.info("outbox", "tap saved on server", data.tap);
      confirmTap(data.tap);
    } catch (e) {
      if (!isPermanent(e)) throw e;
      log.warn("outbox", `tap rejected (${e.status} ${e.code ?? ""}), dropping`, tap);
      dropTap(tap);
      rejected(e);
    }
    const now = loadOutbox();
    now.taps = now.taps.filter((x) => x.id !== tap.id);
    saveOutbox(now);
    return true;
  }
  const patch = o.profile;
  if (!Object.keys(patch).length) return false;
  let data = null;
  try {
    data = await api.saveProfile(patch);
    log.info("outbox", "profile saved on server", patch);
  } catch (e) {
    if (!isPermanent(e)) throw e;
    log.warn("outbox", `profile rejected (${e.status}), dropping`, patch);
    rejected(e);
  }
  // 送っている間に同じ項目がさらに変わっていたら、その分は残して次に送る
  const now = loadOutbox();
  for (const k of Object.keys(patch)) if (now.profile[k] === patch[k]) delete now.profile[k];
  saveOutbox(now);
  if (data) {
    const saved = { updated_at: data.profile.updated_at };
    for (const k of Object.keys(patch)) if (!(k in now.profile)) saved[k] = data.profile[k];
    state.profile = { ...state.profile, ...saved };
    // 別の端末で先に記録されていた項目 (チケット) は、サーバーの値 (上で反映済み) のまま
    if (data.conflicts?.length) {
      log.warn("outbox", "profile conflicts, kept server values", data.conflicts);
      rejected({ code: "conflict" });
    }
  }
  return true;
}

async function run() {
  await null; // running に代入されてから始める
  sync.sending = true;
  updateSyncState();
  try {
    while (await sendOne()) {
      retryCount = 0;
      sync.waiting = false;
      saveBootCache();
      render();
    }
  } catch (e) {
    log.warn("outbox", "send failed, will retry", e);
    sync.waiting = true;
    if (e instanceof ReauthRequired) {
      // 再認証が必要でも書き込みは失わない: 端末に残し、連携し直したあとに送る (login-screen.js)
      if (document.getElementById("reauth")?.hidden !== false) toast(t("tapQueued"));
      showReauth();
    } else scheduleRetry();
  } finally {
    sync.sending = false;
    running = null;
    updateSyncState();
  }
}

// 送信待ちを順に送る。送信中に呼ばれたら、今の送信が続けて拾う (1件ずつ読み直すため)
export function flush() {
  if (DEMO || !state.user) return Promise.resolve();
  migrateLegacy();
  if (!hasOutbox()) {
    updateSyncState();
    return Promise.resolve();
  }
  clearTimeout(retryTimer);
  running ??= run();
  return running;
}

// ---- Service Worker (Background Sync) 用の写し ----
// localStorage は Service Worker から読めないので、IndexedDB に写す。送るときに使う ID トークン (1時間有効) も添える。
// 写しのほうが先に送られても、ページ側の送り直しはサーバーで重複として扱われるだけ。

const DB = "ct-outbox";
const STORE = "kv";
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function mirrorToWorker(o) {
  if (DEMO || !("indexedDB" in window)) return;
  try {
    const empty = !hasOutbox(o);
    const token = empty ? null : await getIdToken();
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      if (empty) tx.objectStore(STORE).delete("outbox");
      else tx.objectStore(STORE).put({ uid: state.user.uid, token, taps: o.taps, profile: o.profile }, "outbox");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    log.warn("outbox", "mirror to IndexedDB failed", e);
  }
}

async function registerBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg && "sync" in reg) await reg.sync.register("ct-outbox");
  } catch (e) {
    log.warn("outbox", "background sync unavailable", e);
  }
}

// 起動時に1回呼ぶ
export function initOutbox() {
  if (DEMO) return;
  addEventListener("online", () => flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") return flush();
    // 隠れたとき: まだ送れていない分をもう一度送り、送り切れなかった分は Background Sync に任せる
    if (!hasOutbox()) return;
    flush();
    // ID トークンが切れていれば取り直して写す (隠れる直前なら、ページはまだ動いている)
    mirrorToWorker(loadOutbox()).then(registerBackgroundSync);
  });
  addEventListener("pagehide", () => hasOutbox() && flush());
}

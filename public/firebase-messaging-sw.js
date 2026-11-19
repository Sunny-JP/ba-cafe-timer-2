// Service Worker (ルート直下に置く必要がある)。次の2つの役割を持つ。
// 1. FCM の通知: 通知は webpush.notification 付きで送られるため、表示は SDK が行う。
// 2. 画面の部品の保存: 同じオリジンの JS・CSS・画像を端末に保存し、2回目以降の起動を速くする。
//    API (/api/*) と管理画面は保存しない。
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

// TODO: js/features/auth.js の firebaseConfig と同じ値にする
firebase.initializeApp({
  apiKey: "AIzaSyCyC07Txb42uJD81IB2W3zuHspu0Ximd7A",
  authDomain: "ba-cafe-timer-2.firebaseapp.com",
  projectId: "ba-cafe-timer-2",
  storageBucket: "ba-cafe-timer-2.firebasestorage.app",
  messagingSenderId: "628000422074",
  appId: "1:628000422074:web:5ab8993694118bda45ea83",
  measurementId: "G-9NNR3Y3H10",
});
firebase.messaging();

// ---- 画面の部品の保存 ----

const CACHE = "ct-static-v1"; // 保存の仕組みを変えたときだけ上げる(古い保存分は activate で消える)
const SKIP = ["/api/", "/cdn-cgi/", "/admin", "/js/admin/", "/firebase-messaging-sw.js"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith("ct-static-") && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

const cacheable = (res) => res.ok && res.type === "basic" && !res.redirected;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || SKIP.some((p) => url.pathname.startsWith(p))) return;

  if (req.mode === "navigate") {
    // ページ本体は常に最新を取りに行き、オフラインのときだけ保存分を使う
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(req);
          if (cacheable(res)) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return (await cache.match(req)) ?? (await cache.match("/")) ?? Promise.reject(e);
        }
      })(),
    );
    return;
  }

  // JS・CSS・画像: 保存分があればすぐ返し、裏で取り直して次回に備える
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const update = fetch(req)
        .then((res) => {
          if (cacheable(res)) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      event.waitUntil(update);
      return cached ?? update;
    })(),
  );
});

// ---- 3. 送信待ちの記録の送信 (Background Sync。対応ブラウザのみ) ----
// アプリを閉じる直前に送り切れなかったタップ・チケットを、通信が戻ったときに送る。
// 中身はページ (js/features/outbox.js) が IndexedDB に写したもの。ページ側も起動時に送り直すが、
// サーバーは同じタップ ID を二重に記録しないので、どちらが先に送っても問題ない。

const DB = "ct-outbox";
const STORE = "kv";
const idb = (mode, fn) =>
  new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => {
        db.close();
        resolve(req?.result);
      };
      tx.onerror = () => reject(tx.error);
    };
  });
const getOutbox = () => idb("readonly", (s) => s.get("outbox"));

// 送れたもの (または内容が不正で送っても無駄なもの) を写しから外す。読み直してから外すので、ページの更新は消さない
const removeSent = (tapId, profile) =>
  idb("readwrite", (s) => {
    const req = s.get("outbox");
    req.onsuccess = () => {
      const o = req.result;
      if (!o) return;
      if (tapId) o.taps = o.taps.filter((t) => t.id !== tapId);
      if (profile) for (const k of Object.keys(profile)) if (o.profile[k] === profile[k]) delete o.profile[k];
      if (!o.taps.length && !Object.keys(o.profile).length) s.delete("outbox");
      else s.put(o, "outbox");
    };
  });

const tokenExpired = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
};

class Retry extends Error {}

async function post(method, path, token, body) {
  const res = await fetch(path, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  // 通信・認証・サーバーの一時的な障害は、ブラウザに後でやり直してもらう。内容が不正 (400・重複 429 など) なら捨てる
  if (!res.ok && (res.status >= 500 || res.status === 401 || res.status === 408)) throw new Retry(`HTTP ${res.status}`);
}

async function sendOutbox() {
  // ページの送信 (閉じる直前の keepalive) が終わるのを少し待ち、送れた分が写しから外れてから読む
  await new Promise((r) => setTimeout(r, 4000));
  // アプリが開いていれば、ページが送る
  const wins = await self.clients.matchAll({ type: "window" });
  if (wins.some((w) => w.visibilityState === "visible")) return;
  const o = await getOutbox();
  // ID トークン (1時間有効) が切れていたら送れない。次にアプリを開いたときにページが送る
  if (!o || !o.token || tokenExpired(o.token)) return;
  for (const tap of o.taps) {
    await post("POST", "/api/taps", o.token, tap);
    await removeSent(tap.id, null);
  }
  if (Object.keys(o.profile).length) {
    await post("PUT", "/api/profile", o.token, o.profile);
    await removeSent(null, o.profile);
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "ct-outbox") event.waitUntil(sendOutbox());
});

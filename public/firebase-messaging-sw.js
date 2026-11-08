// Service Worker (ルート直下に置く必要がある)。次の2つの役割を持つ。
// 1. FCM の通知: 通知は webpush.notification 付きで送られるため、表示は SDK が行う。
// 2. 画面の部品の保存: 同じオリジンの JS・CSS・画像を端末に保存し、2回目以降の起動を速くする。
//    API (/api/*) と管理画面は保存しない。
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

// TODO: js/auth.js の firebaseConfig と同じ値にする
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

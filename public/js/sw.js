// Service Worker (ビルドで /firebase-messaging-sw.js に出力する)。
// 通知の受信、画面の部品の保存、送り切れなかったタップ・チケットの送信 (Background Sync) を行う
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";
import { firebaseConfig } from "./config.js";

getMessaging(initializeApp(firebaseConfig));

// ---- 画面の部品の保存 (API と管理画面は保存しない) ----

const CACHE_NAME = "ct-static-v1";
const NOT_CACHED = ["/api/", "/cdn-cgi/", "/admin", "/dist/admin", "/firebase-messaging-sw.js"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name.startsWith("ct-static-") && name !== CACHE_NAME) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

const isCacheable = (response) => response.ok && response.type === "basic" && !response.redirected;

// ページ本体は常に最新を取りに行き、オフラインのときだけ保存分を使う。JS・CSS・画像は保存分をすぐ返して裏で取り直す
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || NOT_CACHED.some((prefix) => url.pathname.startsWith(prefix))) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      if (request.mode === "navigate") {
        try {
          const response = await fetch(request);
          if (isCacheable(response)) cache.put(request, response.clone());
          return response;
        } catch (error) {
          return (await cache.match(request)) ?? (await cache.match("/")) ?? Promise.reject(error);
        }
      }
      const cached = await cache.match(request);
      const updating = fetch(request)
        .then((response) => {
          if (isCacheable(response)) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      event.waitUntil(updating);
      return cached ?? updating;
    })(),
  );
});

// ---- 送信待ちの記録の送信 (中身はページの outbox.js が IndexedDB に写したもの) ----

const DB_NAME = "ct-outbox";
const STORE_NAME = "kv";

const withDatabase = (mode, operation) =>
  new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore(STORE_NAME);
    opening.onerror = () => reject(opening.error);
    opening.onsuccess = () => {
      const database = opening.result;
      const transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = () => {
        database.close();
        resolve(request?.result);
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });

// 送れたものを写しから外す。読み直してから外すので、ページ側の更新は消さない
const removeSent = (tapId, profile) =>
  withDatabase("readwrite", (objectStore) => {
    const request = objectStore.get("outbox");
    request.onsuccess = () => {
      const outbox = request.result;
      if (!outbox) return;
      if (tapId) outbox.taps = outbox.taps.filter((tap) => tap.id !== tapId);
      if (profile) for (const field of Object.keys(profile)) if (outbox.profile[field] === profile[field]) delete outbox.profile[field];
      if (!outbox.taps.length && !Object.keys(outbox.profile).length) objectStore.delete("outbox");
      else objectStore.put(outbox, "outbox");
    };
  });

// 写しの uid 本人の、期限内のトークンか
function isUsableToken(outbox) {
  try {
    const { exp, sub } = JSON.parse(atob(outbox.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return sub === outbox.uid && exp * 1000 > Date.now() + 30000;
  } catch {
    return false;
  }
}

// 通信・認証・回数制限などの一時的な失敗は、ブラウザにあとでやり直してもらう
async function post(method, path, token, body) {
  const response = await fetch(path, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok && (response.status >= 500 || [401, 408, 429].includes(response.status))) throw new Error(`HTTP ${response.status}`);
}

// 画面が開いていればページに任せる。ページの keepalive 送信が終わるのを少し待ってから読む
async function sendOutbox() {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const windows = await self.clients.matchAll({ type: "window" });
  if (windows.some((client) => client.visibilityState === "visible")) return;
  const outbox = await withDatabase("readonly", (objectStore) => objectStore.get("outbox"));
  if (!outbox?.token || !isUsableToken(outbox)) return;
  for (const tap of outbox.taps) {
    await post("POST", "/api/taps", outbox.token, tap);
    await removeSent(tap.id, null);
  }
  if (Object.keys(outbox.profile).length) {
    await post("PUT", "/api/profile", outbox.token, outbox.profile);
    await removeSent(null, outbox.profile);
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "ct-outbox") event.waitUntil(sendOutbox());
});

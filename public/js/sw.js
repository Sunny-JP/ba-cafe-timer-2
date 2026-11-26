import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";
import { firebaseConfig } from "./config.js";

getMessaging(initializeApp(firebaseConfig));

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

// ページ側の更新を消さないよう、読み直してから外す
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

function isUsableToken(outbox) {
  try {
    const { exp, sub } = JSON.parse(atob(outbox.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return sub === outbox.uid && exp * 1000 > Date.now() + 30000;
  } catch {
    return false;
  }
}

async function post(method, path, token, body) {
  const response = await fetch(path, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok && (response.status >= 500 || [401, 408, 429].includes(response.status))) throw new Error(`HTTP ${response.status}`);
}

// ページと二重に送らないよう、keepalive 送信の完了を待ち、画面があれば任せる
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

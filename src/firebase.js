// Firebase ID トークン検証・Firestore (REST)・FCM HTTP v1。
// 秘密情報: env.FIREBASE_SERVICE_ACCOUNT (wrangler secret)、env.FIREBASE_PROJECT_ID (vars)

import { uuidv7 } from "../public/js/features/time.js";

const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const bytesToB64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const jsonB64url = (obj) => bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));

// ---- ID トークン検証 ----

const JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwkCache = { keys: null, exp: 0 };

async function getJwks() {
  if (jwkCache.keys && jwkCache.exp > Date.now()) return jwkCache.keys;
  const res = await fetch(JWK_URL);
  if (!res.ok) throw new Error("jwk fetch failed");
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] || 3600);
  jwkCache = { keys: (await res.json()).keys, exp: Date.now() + maxAge * 1000 };
  return jwkCache.keys;
}

// 検証に成功すれば uid を返す。失敗時は null。
export async function verifyIdToken(token, projectId) {
  try {
    const [h, p, s] = token.split(".");
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    if (header.alg !== "RS256") return null;
    const jwk = (await getJwks()).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
    const now = Date.now() / 1000;
    if (!ok || payload.exp < now || payload.iat > now + 60) return null;
    if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    return payload.sub || null;
  } catch {
    return null;
  }
}

// ---- サービスアカウントのアクセストークン ----

let saCache = { token: null, exp: 0 };

async function serviceToken(env) {
  if (saCache.token && saCache.exp > Date.now() + 60000) return saCache.token;
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    jsonB64url({ alg: "RS256", typ: "JWT" }) +
    "." +
    jsonB64url({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/identitytoolkit",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    });
  const der = b64urlToBytes(
    sa.private_key
      .replace(/-----[^-]+-----|\s/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_"),
  );
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${bytesToB64url(sig)}`,
    }),
  });
  if (!res.ok) throw new Error("service account auth failed");
  const json = await res.json();
  saCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return saCache.token;
}

// ---- Firestore (devices / pending) ----

const fsBase = (env) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function fs(env, path, init = {}) {
  const res = await fetch(`${fsBase(env)}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await serviceToken(env)}` },
  });
  if (!res.ok && res.status !== 404) throw new Error(`firestore ${res.status}`);
  return res;
}

export async function getDevices(env, uid) {
  const res = await fs(env, `/devices/${uid}`);
  if (res.status === 404) return [];
  const doc = await res.json();
  return (doc.fields?.tokens?.arrayValue?.values || []).map((v) => v.stringValue);
}

export async function setDevices(env, uid, tokens) {
  if (!tokens.length) {
    await fs(env, `/devices/${uid}`, { method: "DELETE" });
    return;
  }
  const values = tokens.map((stringValue) => ({ stringValue }));
  await fs(env, `/devices/${uid}`, { method: "PATCH", body: JSON.stringify({ fields: { tokens: { arrayValue: { values } } } }) });
}

// ---- Drive のリフレッシュトークン (暗号化済みの文字列だけを保存する) ----

export async function getDriveAuth(env, uid) {
  const res = await fs(env, `/driveAuth/${uid}`);
  if (res.status === 404) return null;
  return (await res.json()).fields?.enc?.stringValue ?? null;
}

export async function setDriveAuth(env, uid, enc) {
  await fs(env, `/driveAuth/${uid}`, { method: "PATCH", body: JSON.stringify({ fields: { enc: { stringValue: enc } } }) });
}

export async function deleteDriveAuth(env, uid) {
  await fs(env, `/driveAuth/${uid}`, { method: "DELETE" });
}

// ---- 管理画面用: カタログ (追加キャラ・贈物) と集計 ----

let catalogCache = { value: null, exp: 0 };
const EMPTY_CATALOG = { characters: [] };

export async function getCatalog(env) {
  if (catalogCache.value && catalogCache.exp > Date.now()) return catalogCache.value;
  const res = await fs(env, "/config/catalog");
  let value = EMPTY_CATALOG;
  if (res.status !== 404) {
    try {
      value = JSON.parse((await res.json()).fields?.json?.stringValue ?? "null") ?? EMPTY_CATALOG;
    } catch {
      /* 壊れていたら空として扱う */
    }
  }
  catalogCache = { value, exp: Date.now() + 30000 };
  return value;
}

export async function setCatalog(env, catalog) {
  await fs(env, "/config/catalog", { method: "PATCH", body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(catalog) } } }) });
  catalogCache = { value: catalog, exp: Date.now() + 30000 };
}

// 統計カウンタ (stats/counters)。個人を特定できる情報は持たず、数だけを加減算する。
export async function addCounts(env, deltas) {
  const entries = Object.entries(deltas).filter(([, n]) => n);
  if (!entries.length) return;
  const base = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  await fs(env, ":commit", {
    method: "POST",
    body: JSON.stringify({
      writes: [
        {
          transform: {
            document: `${base}/stats/counters`,
            fieldTransforms: entries.map(([k, n]) => ({ fieldPath: `\`${k}\``, increment: { integerValue: String(n) } })),
          },
        },
      ],
    }),
  });
}

export async function getCounts(env) {
  const res = await fs(env, "/stats/counters");
  if (res.status === 404) return {};
  const fields = (await res.json()).fields ?? {};
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, Number(v.integerValue ?? 0)]));
}

export async function countDevices(env) {
  const res = await fs(env, ":runAggregationQuery", {
    method: "POST",
    body: JSON.stringify({
      structuredAggregationQuery: {
        structuredQuery: { from: [{ collectionId: "devices" }] },
        aggregations: [{ count: {}, alias: "n" }],
      },
    }),
  });
  return Number((await res.json())[0]?.result?.aggregateFields?.n?.integerValue ?? 0);
}

// Firebase Auth の登録ユーザー数。権限が足りないなどで取れなければ null
export async function countUsers(env) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts:query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await serviceToken(env)}` },
      body: JSON.stringify({ returnUserInfo: false }),
    });
    return res.ok ? Number((await res.json()).recordsCount ?? 0) : null;
  } catch {
    return null;
  }
}

export async function addPending(env, uid, sendAtMs) {
  await fs(env, `/pending/${uuidv7()}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { uid: { stringValue: uid }, sendAt: { timestampValue: new Date(sendAtMs).toISOString() } } }),
  });
}

async function queryPending(env, filter) {
  const res = await fs(env, ":runQuery", {
    method: "POST",
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "pending" }], where: filter, limit: 200 } }),
  });
  return (await res.json())
    .filter((r) => r.document)
    .map((r) => ({
      name: r.document.name,
      uid: r.document.fields.uid.stringValue,
    }));
}

async function removeDoc(env, name) {
  await fetch(`https://firestore.googleapis.com/v1/${name}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${await serviceToken(env)}` },
  });
}

// ユーザーごとに「統計へ反映済みの絆の寄与」を持つ(差分加算用。記録そのものは持たない)
export async function getBondStats(env, uid) {
  const res = await fs(env, `/statsBonds/${uid}`);
  if (res.status === 404) return {};
  try {
    return JSON.parse((await res.json()).fields?.json?.stringValue ?? "{}") ?? {};
  } catch {
    return {};
  }
}

export async function setBondStats(env, uid, counts) {
  await fs(env, `/statsBonds/${uid}`, { method: "PATCH", body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(counts) } } }) });
}

export async function deleteUserData(env, uid) {
  // 統計から、このユーザーの分を差し引く
  const prev = await getBondStats(env, uid);
  await addCounts(env, Object.fromEntries(Object.entries(prev).map(([k, n]) => [k, -n])));
  await fs(env, `/statsBonds/${uid}`, { method: "DELETE" });
  await fs(env, `/devices/${uid}`, { method: "DELETE" });
  await deleteDriveAuth(env, uid);
  const mine = await queryPending(env, {
    fieldFilter: { field: { fieldPath: "uid" }, op: "EQUAL", value: { stringValue: uid } },
  });
  for (const d of mine) await removeDoc(env, d.name);
}

// ---- 通知送信 (cron から呼ぶ) ----

const MESSAGES = [
  { title: "先生！お仕事お疲れ様です！", body: "生徒さんたちが待ってますよ！" },
  { title: "先生、お仕事お疲れ様です。", body: "生徒のみなさんがお待ちです。" },
];

const randomMessage = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

async function sendFcm(env, token, m = randomMessage()) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await serviceToken(env)}` },
    body: JSON.stringify({
      message: { token, webpush: { notification: { ...m, icon: "/img/icon.svg" }, fcm_options: { link: "/" } } },
    }),
  });
  if (res.ok) return { result: "ok" };
  // 失敗の理由 (UNREGISTERED / SENDER_ID_MISMATCH / PERMISSION_DENIED など)。トークンや本文は含まれない
  const code = (await res.json().catch(() => null))?.error?.status ?? "";
  return { result: res.status === 404 || res.status === 400 ? "gone" : "error", status: res.status, code };
}

// 管理画面のテスト通知。本人の端末にだけ送る
export async function sendTestNotification(env, uid) {
  const tokens = await getDevices(env, uid);
  const result = { devices: tokens.length, ok: 0, gone: 0, error: 0, failures: [] };
  const alive = [];
  for (const t of tokens) {
    const r = await sendFcm(env, t, { title: "テスト通知", body: "管理画面から送信されました。" });
    result[r.result]++;
    if (r.result !== "ok") result.failures.push(`${r.status} ${r.code}`.trim());
    if (r.result !== "gone") alive.push(t);
  }
  if (alive.length !== tokens.length) await setDevices(env, uid, alive);
  return result;
}

export async function sendDueNotifications(env) {
  const due = await queryPending(env, {
    fieldFilter: {
      field: { fieldPath: "sendAt" },
      op: "LESS_THAN_OR_EQUAL",
      value: { timestampValue: new Date().toISOString() },
    },
  });
  for (const d of due) {
    // 1件の失敗で残りの通知が止まらないようにする
    try {
      const tokens = await getDevices(env, d.uid);
      const alive = [];
      for (const t of tokens) {
        const r = await sendFcm(env, t);
        if (r.result !== "ok") console.error("fcm send failed", r.status, r.code);
        if (r.result !== "gone") alive.push(t);
      }
      if (alive.length !== tokens.length) await setDevices(env, d.uid, alive);
      await removeDoc(env, d.name);
    } catch (e) {
      console.error("send due notification failed", e?.message);
    }
  }
}

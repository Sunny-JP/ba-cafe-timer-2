// Firebase ID トークン検証・Firestore (REST)・FCM HTTP v1。
// 秘密情報: env.FIREBASE_SERVICE_ACCOUNT (wrangler secret)、env.FIREBASE_PROJECT_ID (vars)

import { uuidv7 } from '../public/js/time.js';

const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const bytesToB64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jsonB64url = (obj) => bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));

// ---- ID トークン検証 ----

const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwkCache = { keys: null, exp: 0 };

async function getJwks() {
  if (jwkCache.keys && jwkCache.exp > Date.now()) return jwkCache.keys;
  const res = await fetch(JWK_URL);
  if (!res.ok) throw new Error('jwk fetch failed');
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  jwkCache = { keys: (await res.json()).keys, exp: Date.now() + maxAge * 1000 };
  return jwkCache.keys;
}

// 検証に成功すれば uid を返す。失敗時は null。
export async function verifyIdToken(token, projectId) {
  try {
    const [h, p, s] = token.split('.');
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    if (header.alg !== 'RS256') return null;
    const jwk = (await getJwks()).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
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
    jsonB64url({ alg: 'RS256', typ: 'JWT' }) +
    '.' +
    jsonB64url({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });
  const der = b64urlToBytes(sa.private_key.replace(/-----[^-]+-----|\s/g, '').replace(/\+/g, '-').replace(/\//g, '_'));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${bytesToB64url(sig)}`,
    }),
  });
  if (!res.ok) throw new Error('service account auth failed');
  const json = await res.json();
  saCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return saCache.token;
}

// ---- Firestore (devices / pending) ----

const fsBase = (env) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function fs(env, path, init = {}) {
  const res = await fetch(`${fsBase(env)}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await serviceToken(env)}` },
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
  const values = tokens.map((stringValue) => ({ stringValue }));
  await fs(env, `/devices/${uid}`, { method: 'PATCH', body: JSON.stringify({ fields: { tokens: { arrayValue: { values } } } }) });
}

export async function addPending(env, uid, sendAtMs) {
  await fs(env, `/pending/${uuidv7()}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { uid: { stringValue: uid }, sendAt: { timestampValue: new Date(sendAtMs).toISOString() } } }),
  });
}

async function queryPending(env, filter) {
  const res = await fs(env, ':runQuery', {
    method: 'POST',
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'pending' }], where: filter, limit: 200 } }),
  });
  return (await res.json()).filter((r) => r.document).map((r) => ({
    name: r.document.name,
    uid: r.document.fields.uid.stringValue,
  }));
}

async function removeDoc(env, name) {
  await fetch(`https://firestore.googleapis.com/v1/${name}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${await serviceToken(env)}` },
  });
}

export async function deleteUserData(env, uid) {
  await fs(env, `/devices/${uid}`, { method: 'DELETE' });
  const mine = await queryPending(env, {
    fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: uid } },
  });
  for (const d of mine) await removeDoc(env, d.name);
}

// ---- 通知送信 (cron から呼ぶ) ----

const MESSAGES = [
  { title: 'カフェの時間です', body: '生徒がお待ちかねです。タップしに行きましょう!' },
  { title: '3時間経ちました', body: 'カフェを覗いて、生徒をタップしましょう。' },
  { title: 'お茶の時間', body: 'そろそろカフェ巡りの時間です。' },
];

async function sendFcm(env, token) {
  const m = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await serviceToken(env)}` },
    body: JSON.stringify({
      message: { token, webpush: { notification: { ...m, icon: '/img/icon.svg' }, fcm_options: { link: '/' } } },
    }),
  });
  return res.ok ? 'ok' : res.status === 404 || res.status === 400 ? 'gone' : 'error';
}

export async function sendDueNotifications(env) {
  const due = await queryPending(env, {
    fieldFilter: {
      field: { fieldPath: 'sendAt' },
      op: 'LESS_THAN_OR_EQUAL',
      value: { timestampValue: new Date().toISOString() },
    },
  });
  for (const d of due) {
    const tokens = await getDevices(env, d.uid);
    const alive = [];
    for (const t of tokens) if ((await sendFcm(env, t)) !== 'gone') alive.push(t);
    if (alive.length !== tokens.length) await setDevices(env, d.uid, alive);
    await removeDoc(env, d.name);
  }
}

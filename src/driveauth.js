// Drive のリフレッシュトークンをサーバー側で保持し、アクセストークンを発行する。
// リフレッシュトークンは AES-GCM で暗号化(鍵は env.TOKEN_ENC_KEY、uid を認証データに束縛)して Firestore に置き、
// ブラウザには一切返さない。秘密情報: env.GOOGLE_CLIENT_SECRET, env.TOKEN_ENC_KEY (wrangler secret)

import { deleteDriveAuth, getDriveAuth, setDriveAuth } from './firebase.js';

const CLIENT_ID = '628000422074-hrfs7ptufkgvcbd0p2cuu1qdlb5sd52u.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const bytesToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

const cryptoKey = (env) => crypto.subtle.importKey('raw', b64ToBytes(env.TOKEN_ENC_KEY), 'AES-GCM', false, ['encrypt', 'decrypt']);

async function encrypt(env, uid, plain) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(uid) },
    await cryptoKey(env),
    new TextEncoder().encode(plain),
  );
  return `${bytesToB64(iv)}.${bytesToB64(data)}`;
}

async function decrypt(env, uid, enc) {
  const [iv, data] = enc.split('.').map(b64ToBytes);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(uid) },
    await cryptoKey(env),
    data,
  );
  return new TextDecoder().decode(plain);
}

const configured = (env) => !!(env.GOOGLE_CLIENT_SECRET && env.TOKEN_ENC_KEY);

async function tokenRequest(env, params) {
  return fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, ...params }),
  });
}

// ブラウザで得た認可コードをリフレッシュトークンに交換して保存する。成功すれば true
export async function linkDrive(env, uid, code) {
  if (!configured(env) || typeof code !== 'string' || !code) return false;
  const res = await tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: 'postmessage' });
  if (!res.ok) return false;
  const json = await res.json();
  // drive.appdata 以外の権限は持たせず、スコープが足りない・リフレッシュトークンが無い場合も失敗にする
  if (!json.refresh_token || !(json.scope ?? '').split(' ').includes(DRIVE_SCOPE)) return false;
  await setDriveAuth(env, uid, await encrypt(env, uid, json.refresh_token));
  cache.set(uid, { token: json.access_token, exp: Date.now() + (json.expires_in - 120) * 1000 });
  return true;
}

// 同じ isolate 内では有効期限までアクセストークンを使い回す
const cache = new Map();

export const forgetAccessToken = (uid) => cache.delete(uid);

// リンク済みならアクセストークン、未リンク・失効なら null
export async function getAccessToken(env, uid) {
  const hit = cache.get(uid);
  if (hit && hit.exp > Date.now()) return hit.token;
  if (!configured(env)) return null;
  const enc = await getDriveAuth(env, uid);
  if (!enc) return null;
  let refresh;
  try {
    refresh = await decrypt(env, uid, enc);
  } catch {
    return null; // 鍵が変わった等。再リンクしてもらう
  }
  const res = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: refresh });
  if (!res.ok) {
    // 取り消された・失効した場合だけ破棄(一時的な障害では残す)
    if ((await res.json().catch(() => null))?.error === 'invalid_grant') await deleteDriveAuth(env, uid);
    return null;
  }
  const json = await res.json();
  cache.set(uid, { token: json.access_token, exp: Date.now() + (json.expires_in - 120) * 1000 });
  return json.access_token;
}

// アカウント削除時: Google 側でも取り消し、保存分を消す
export async function unlinkDrive(env, uid) {
  cache.delete(uid);
  if (!configured(env)) return;
  const enc = await getDriveAuth(env, uid).catch(() => null);
  if (enc) {
    try {
      const refresh = await decrypt(env, uid, enc);
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: refresh }),
      });
    } catch {
      /* 取り消せなくても保存分は消す */
    }
  }
  await deleteDriveAuth(env, uid);
}

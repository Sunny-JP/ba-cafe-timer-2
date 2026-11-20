// Google Drive: リフレッシュトークンの保管・アクセストークンの発行と、appDataFolder の読み書き。
// リフレッシュトークンは AES-GCM (鍵 env.TOKEN_ENC_KEY、uid を認証データに束縛) で暗号化して Firestore に置く
import { DRIVE_SCOPE, GOOGLE_CLIENT_ID } from '../public/js/config.js';
import { deleteDriveAuth, getDriveAuth, setDriveAuth } from './firebase.js';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
// これ以外のスコープが付いた連携は受け付けない
const ALLOWED_SCOPES = new Set([
  DRIVE_SCOPE,
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]);

// ---- トークン ----

const base64ToBytes = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
const bytesToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const encryptionKey = (env) => crypto.subtle.importKey('raw', base64ToBytes(env.TOKEN_ENC_KEY), 'AES-GCM', false, ['encrypt', 'decrypt']);
const cipherParams = (iv, uid) => ({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(uid) });

async function encrypt(env, uid, plainText) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherText = await crypto.subtle.encrypt(cipherParams(iv, uid), await encryptionKey(env), new TextEncoder().encode(plainText));
  return `${bytesToBase64(iv)}.${bytesToBase64(cipherText)}`;
}

async function decrypt(env, uid, encrypted) {
  const [iv, cipherText] = encrypted.split('.').map(base64ToBytes);
  return new TextDecoder().decode(await crypto.subtle.decrypt(cipherParams(iv, uid), await encryptionKey(env), cipherText));
}

const isConfigured = (env) => !!(env.GOOGLE_CLIENT_SECRET && env.TOKEN_ENC_KEY);

const postForm = (url, params) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
const requestToken = (env, params) => postForm(TOKEN_URL, { client_id: GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, ...params });
const revoke = (token) => postForm(REVOKE_URL, { token }).catch(() => {});

// 同じ isolate 内では期限までアクセストークンを使い回す
const accessTokens = new Map();
const rememberAccessToken = (uid, result) => accessTokens.set(uid, { token: result.access_token, expiresAt: Date.now() + (result.expires_in - 120) * 1000 });
export const forgetAccessToken = (uid) => accessTokens.delete(uid);

// ブラウザで得た認可コードをリフレッシュトークンに交換して保存する。成功すれば true
export async function linkDrive(env, uid, code) {
  if (!isConfigured(env) || typeof code !== 'string' || !code) return false;
  const response = await requestToken(env, { grant_type: 'authorization_code', code, redirect_uri: 'postmessage' });
  if (!response.ok) return false;
  const result = await response.json();
  const scopes = (result.scope ?? '').split(' ').filter(Boolean);
  if (!result.refresh_token || !scopes.includes(DRIVE_SCOPE) || scopes.some((scope) => !ALLOWED_SCOPES.has(scope))) {
    if (result.refresh_token) await revoke(result.refresh_token);
    return false;
  }
  await setDriveAuth(env, uid, await encrypt(env, uid, result.refresh_token));
  rememberAccessToken(uid, result);
  return true;
}

// 連携済みならアクセストークン、未連携・失効なら null。取り消し・失効 (invalid_grant) のときだけ保存分を消す
export async function getAccessToken(env, uid) {
  const cached = accessTokens.get(uid);
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  if (!isConfigured(env)) return null;
  const encrypted = await getDriveAuth(env, uid);
  if (!encrypted) return null;
  const refreshToken = await decrypt(env, uid, encrypted).catch(() => null);
  if (!refreshToken) return null;
  const response = await requestToken(env, { grant_type: 'refresh_token', refresh_token: refreshToken });
  if (!response.ok) {
    if ((await response.json().catch(() => null))?.error === 'invalid_grant') await deleteDriveAuth(env, uid);
    return null;
  }
  const result = await response.json();
  rememberAccessToken(uid, result);
  return result.access_token;
}

// アカウント削除: Google 側でも取り消し、保存分を消す
export async function unlinkDrive(env, uid) {
  accessTokens.delete(uid);
  if (!isConfigured(env)) return;
  const encrypted = await getDriveAuth(env, uid).catch(() => null);
  if (encrypted) await revoke(await decrypt(env, uid, encrypted).catch(() => ''));
  await deleteDriveAuth(env, uid);
}

// ---- appDataFolder ----

export class DriveError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ファイル名 → ID の一覧は同じ isolate 内で 10 分使い回し、見つからないとき・404 のときは取り直す
const INDEX_TTL = 10 * 60 * 1000;
const fileIndexCache = new Map();

export class Drive {
  constructor(token, uid) {
    this.token = token;
    this.uid = uid;
    const cached = uid && fileIndexCache.get(uid);
    this.ids = cached && cached.expiresAt > Date.now() ? cached.ids : null;
    this.fresh = false;
  }

  async fetch(url, init = {}) {
    const response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${this.token}` } });
    if (!response.ok) throw new DriveError(response.status, `Drive API ${response.status}`);
    return response;
  }

  async index(refresh = false) {
    if (!this.ids || refresh) {
      const query = new URLSearchParams({ spaces: 'appDataFolder', fields: 'files(id,name)', pageSize: '1000' });
      const { files } = await (await this.fetch(`${API}/files?${query}`)).json();
      this.ids = new Map(files.map((file) => [file.name, file.id]));
      this.fresh = true;
      if (this.uid) fileIndexCache.set(this.uid, { ids: this.ids, expiresAt: Date.now() + INDEX_TTL });
    }
    return this.ids;
  }

  async idOf(name) {
    const id = (await this.index()).get(name);
    if (id || this.fresh) return id;
    return (await this.index(true)).get(name);
  }

  async retryWithFreshIndex(operation) {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof DriveError) || error.status !== 404 || this.fresh) throw error;
      await this.index(true);
      return operation();
    }
  }

  read(name, fallback) {
    return this.retryWithFreshIndex(async () => {
      const id = await this.idOf(name);
      return id ? (await this.fetch(`${API}/files/${id}?alt=media`)).json() : fallback;
    });
  }

  write(name, data) {
    return this.retryWithFreshIndex(async () => {
      const id = await this.idOf(name);
      const content = JSON.stringify({ schema: 1, ...data });
      if (id) {
        await this.fetch(`${UPLOAD}/files/${id}?uploadType=media&fields=id`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content });
        return;
      }
      const boundary = `ct${crypto.randomUUID()}`;
      const metadata = JSON.stringify({ name, parents: ['appDataFolder'], mimeType: 'application/json' });
      const response = await this.fetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`,
      });
      this.ids.set(name, (await response.json()).id);
    });
  }

  async removeAll() {
    for (const id of (await this.index(true)).values()) await this.fetch(`${API}/files/${id}`, { method: 'DELETE' });
    this.ids = new Map();
    if (this.uid) fileIndexCache.delete(this.uid);
  }
}

// /api/* 呼び出しのみ。Firestore / Drive には直接触れない。
import { getIdToken, ReauthRequired } from './auth.js';
import { log } from './log.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// サーバーは Drive 上のファイルを「読む→書き換える→丸ごと上書き」する。書き込みが同時に走ると
// 片方の更新が消えるため、書き込み系のリクエストは1本ずつ順番に送る。
let writeQueue = Promise.resolve();
function request(method, path, body, opts, retry) {
  if (method === 'GET') return send(method, path, body, opts, retry);
  log.info('api', `queued write: ${method} ${path} (waiting for earlier writes)`);
  const run = writeQueue.then(() => send(method, path, body, opts, retry));
  writeQueue = run.catch(() => {});
  return run;
}

let seq = 0;
async function send(method, path, body, { drive = true } = {}, retry = true) {
  const tag = `#${++seq} ${method} ${path}`;
  const t0 = performance.now();
  const ms = () => `${Math.round(performance.now() - t0)}ms`;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  log.info('api', `${tag} request${retry ? '' : ' (retry)'} online=${navigator.onLine} body=${payload ?? '(none)'}`);
  let res;
  let text;
  try {
    const headers = { Authorization: `Bearer ${await getIdToken()}` };
    log.info('api', `${tag} got ID token (${ms()})`);
    if (payload !== undefined) headers['Content-Type'] = 'application/json';
    res = await fetch(path, { method, headers, body: payload });
    text = await res.text();
  } catch (e) {
    log.error('api', `${tag} failed before a response (${ms()}, online=${navigator.onLine})`, e);
    throw e;
  }
  log.info('api', `${tag} response status=${res.status} (${ms()}) body=${text}`);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
    log.warn('api', `${tag} response body is not valid JSON`);
  }
  if (res.ok) return data;
  if (res.status === 401 && data.code === 'drive_token') {
    if (retry) return send(method, path, body, { drive }, false);
    throw new ReauthRequired(data.error);
  }
  throw new ApiError(res.status, data.error ?? `エラー (${res.status})`);
}

export const api = {
  bootstrap: (month) => request('GET', `/api/bootstrap?month=${month}`),
  taps: (month) => request('GET', `/api/taps?month=${month}`),
  tap: (queued) => request('POST', '/api/taps', queued),
  saveProfile: (patch) => request('PUT', '/api/profile', patch),
  addBond: (bond) => request('POST', '/api/relationship', bond),
  deleteBond: (id) => request('DELETE', '/api/relationship', { id }),
  registerDevice: (token) => request('PUT', '/api/devices', { token }, { drive: false }),
  unregisterDevice: (token) => request('DELETE', '/api/devices', { token }, { drive: false }),
  relationship: () => request('GET', '/api/relationship'),
  gamedata: (version) => request('GET', `/api/gamedata${version ? `?v=${version}` : ''}`, undefined, { drive: false }),
  catalog: () => request('GET', '/api/catalog', undefined, { drive: false }),
  adminMe: () => request('GET', '/api/admin/me', undefined, { drive: false }),
  adminStats: () => request('GET', '/api/admin/stats', undefined, { drive: false }),
  adminTestPush: () => request('POST', '/api/admin/test-push', undefined, { drive: false }),
  adminTestTap: (body) => request('POST', '/api/admin/test-tap', body, { drive: false }),
  adminSaveCatalog: (catalog) => request('PUT', '/api/admin/catalog', catalog, { drive: false }),
  linkDrive: (code) => request('POST', '/api/auth/drive', { code }, { drive: false }),
  deleteAccount: () => request('DELETE', '/api/account'),
  exportData: () => request('GET', '/api/export'),
  importData: (data) => request('POST', '/api/import', data),
};

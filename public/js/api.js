// /api/* 呼び出しのみ。Firestore / Drive には直接触れない。
import { getIdToken, ReauthRequired } from './auth.js';

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
  const run = writeQueue.then(() => send(method, path, body, opts, retry));
  writeQueue = run.catch(() => {});
  return run;
}

async function send(method, path, body, { drive = true } = {}, retry = true) {
  const headers = { Authorization: `Bearer ${await getIdToken()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
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

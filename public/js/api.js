// /api/* 呼び出しのみ。Firestore / Drive には直接触れない。
import { getIdToken, ReauthRequired } from './auth.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body, { drive = true } = {}, retry = true) {
  const headers = { Authorization: `Bearer ${await getIdToken()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  if (res.status === 401 && data.code === 'drive_token') {
    if (retry) return request(method, path, body, { drive }, false);
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
  gamedata: () => request('GET', '/api/gamedata', undefined, { drive: false }),
  catalog: () => request('GET', '/api/catalog', undefined, { drive: false }),
  adminMe: () => request('GET', '/api/admin/me', undefined, { drive: false }),
  adminStats: () => request('GET', '/api/admin/stats', undefined, { drive: false }),
  adminTestPush: () => request('POST', '/api/admin/test-push', undefined, { drive: false }),
  adminTestTap: (body) => request('POST', '/api/admin/test-tap', body, { drive: false }),
  adminSaveCatalog: (catalog) => request('PUT', '/api/admin/catalog', catalog, { drive: false }),
  linkDrive: (code) => request('POST', '/api/auth/drive', { code }, { drive: false }),
  deleteAccount: () => request('DELETE', '/api/account'),
  importData: (data) => request('POST', '/api/import', data),
};

// ルーティングと cron。静的ファイルは Static Assets が配信し、/api/* だけここに来る。

import { Drive, DriveError } from './drive.js';
import { verifyIdToken, getDevices, setDevices, addPending, deleteUserData, sendDueNotifications } from './firebase.js';
import {
  DUPLICATE_WINDOW,
  isMonth,
  isValidTimeZone,
  logicalMonth,
  monthRange,
  prevMonth,
  shouldScheduleNotification,
  uuidv7,
} from '../public/js/time.js';

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

const DEFAULT_PROFILE = { ticket1_time: null, ticket2_time: null, timezone: null, updated_at: null };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isIso = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s));
const isUuid = (s) => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s);

// ---- Drive 上のデータ ----

const tapsFile = (month) => `taps-${month}.json`;
const readTaps = async (drive, month) => (await drive.read(tapsFile(month), { taps: [] })).taps;
const readProfile = async (drive) => ({ ...DEFAULT_PROFILE, ...(await drive.read('profile.json', {})) });
const readBonds = async (drive) => (await drive.read('relationship.json', { items: [] })).items;
const byRecordedDesc = (a, b) => (a.recorded_at < b.recorded_at ? 1 : a.recorded_at > b.recorded_at ? -1 : 0);

// 当月の最後のタップ。当月が空なら前月を見る。
async function lastTap(drive, month, taps) {
  const list = taps.length ? taps : await readTaps(drive, prevMonth(month));
  return list.reduce((a, t) => (!a || t.tap_time > a.tap_time ? t : a), null);
}

function validBond(b) {
  if (typeof b.char_key !== 'string' || !b.char_key || b.char_key.length > 64) return 'char_key が不正です。';
  if (!Number.isInteger(b.bond_level) || b.bond_level < 1 || b.bond_level > 100) return 'bond_level は 1〜100 です。';
  if (!DATE_RE.test(b.recorded_at ?? '')) return 'recorded_at は YYYY-MM-DD 形式です。';
  return null;
}

const bondExists = (items, b) => items.some((x) => x.char_key === b.char_key && x.bond_level === b.bond_level);

// ---- ハンドラ ----

const routes = {
  'GET /api/bootstrap': async ({ drive, url }) => {
    const month = url.searchParams.get('month') ?? logicalMonth(Date.now());
    if (!isMonth(month)) throw new HttpError(400, 'month が不正です。');
    const [profile, taps, items] = await Promise.all([readProfile(drive), readTaps(drive, month), readBonds(drive)]);
    return { profile, month, taps, last_tap: await lastTap(drive, month, taps), relationship: items.sort(byRecordedDesc) };
  },

  'GET /api/taps': async ({ drive, url }) => {
    const month = url.searchParams.get('month');
    if (!isMonth(month ?? '')) throw new HttpError(400, 'month が不正です。');
    return { month, taps: await readTaps(drive, month) };
  },

  'POST /api/taps': async ({ drive, env, uid }) => {
    const now = Date.now();
    const month = logicalMonth(now);
    const taps = await readTaps(drive, month);
    const last = await lastTap(drive, month, taps);
    if (last && now - Date.parse(last.tap_time) < DUPLICATE_WINDOW) throw new HttpError(429, '直前に記録済みです。');
    const tap = { id: uuidv7(now), tap_time: new Date(now).toISOString() };
    await drive.write(tapsFile(month), { taps: [...taps, tap] });

    // 通知の失敗でタップの記録は失敗させない
    let scheduled = false;
    const sendAt = shouldScheduleNotification(now);
    if (sendAt && env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        await addPending(env, uid, sendAt);
        scheduled = true;
      } catch {
        /* 通知予約のみ失敗 */
      }
    }
    return { tap, scheduled };
  },

  'PUT /api/profile': async ({ drive, body }) => {
    const profile = await readProfile(drive);
    for (const k of ['ticket1_time', 'ticket2_time']) {
      if (k in body) {
        if (body[k] !== null && !isIso(body[k])) throw new HttpError(400, `${k} が不正です。`);
        profile[k] = body[k];
      }
    }
    if ('timezone' in body) {
      if (body.timezone !== null && !isValidTimeZone(body.timezone)) throw new HttpError(400, 'timezone が不正です。');
      profile.timezone = body.timezone;
    }
    profile.updated_at = new Date().toISOString();
    await drive.write('profile.json', profile);
    return { profile };
  },

  'GET /api/relationship': async ({ drive }) => ({ relationship: (await readBonds(drive)).sort(byRecordedDesc) }),

  'POST /api/relationship': async ({ drive, body }) => {
    const err = validBond(body);
    if (err) throw new HttpError(400, err);
    const items = await readBonds(drive);
    if (bondExists(items, body)) throw new HttpError(409, `RANK ${body.bond_level} は既に登録されています。`);
    const now = new Date().toISOString();
    const item = {
      id: uuidv7(),
      char_key: body.char_key,
      bond_level: body.bond_level,
      recorded_at: body.recorded_at,
      created_at: now,
      updated_at: now,
    };
    await drive.write('relationship.json', { items: [...items, item] });
    return { item };
  },

  'DELETE /api/relationship': async ({ drive, body, url }) => {
    const id = body.id ?? url.searchParams.get('id');
    const items = await readBonds(drive);
    if (!items.some((x) => x.id === id)) throw new HttpError(404, '見つかりません。');
    await drive.write('relationship.json', { items: items.filter((x) => x.id !== id) });
    return { ok: true };
  },

  'PUT /api/devices': async ({ env, uid, body }) => {
    if (typeof body.token !== 'string' || !body.token) throw new HttpError(400, 'token が不正です。');
    const tokens = await getDevices(env, uid);
    if (!tokens.includes(body.token)) await setDevices(env, uid, [...tokens, body.token].slice(-10));
    return { ok: true };
  },

  'DELETE /api/devices': async ({ env, uid, body }) => {
    const tokens = await getDevices(env, uid);
    await setDevices(env, uid, tokens.filter((t) => t !== body.token));
    return { ok: true };
  },

  'DELETE /api/account': async ({ drive, env, uid }) => {
    await drive.removeAll();
    // Drive のデータは消去済み。通知情報の掃除に失敗しても、ユーザーにはエラーを返さない。
    if (env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        await deleteUserData(env, uid);
      } catch (e) {
        // 秘密情報を含み得るため、自前のメッセージ(firestore 403 など)だけを出す
        const safe = /^(firestore \d+|service account auth failed)$/.test(e?.message) ? e.message : '';
        console.error('deleteUserData failed', e?.name, safe);
      }
    }
    return { ok: true };
  },

  // 旧データの取り込み。既存 ID を保持し、不正な行・重複は読み飛ばす。
  'POST /api/import': async ({ drive, body }) => {
    const result = { taps: 0, relationship: 0, skipped: 0, profile: false };

    const byMonth = new Map();
    for (const t of body.taps ?? []) {
      if (!isIso(t?.tap_time)) {
        result.skipped++;
        continue;
      }
      const ms = Date.parse(t.tap_time);
      const m = logicalMonth(ms);
      const [start, end] = monthRange(m);
      if (ms < start || ms >= end) continue;
      byMonth.set(m, [...(byMonth.get(m) ?? []), { id: isUuid(t.id) ? t.id : uuidv7(ms), tap_time: new Date(ms).toISOString() }]);
    }
    for (const [m, incoming] of byMonth) {
      const existing = await readTaps(drive, m);
      const seen = new Set(existing.map((t) => t.id));
      const merged = [...existing];
      for (const t of incoming) {
        if (seen.has(t.id)) {
          result.skipped++;
        } else {
          seen.add(t.id);
          merged.push(t);
          result.taps++;
        }
      }
      merged.sort((a, b) => (a.tap_time < b.tap_time ? -1 : 1));
      await drive.write(tapsFile(m), { taps: merged });
    }

    if (Array.isArray(body.relationship)) {
      const items = await readBonds(drive);
      const now = new Date().toISOString();
      for (const b of body.relationship) {
        if (validBond(b || {}) || bondExists(items, b)) {
          result.skipped++;
          continue;
        }
        items.push({
          id: isUuid(b.id) ? b.id : uuidv7(),
          char_key: b.char_key,
          bond_level: b.bond_level,
          recorded_at: b.recorded_at,
          created_at: isIso(b.created_at) ? b.created_at : now,
          updated_at: isIso(b.updated_at) ? b.updated_at : now,
        });
        result.relationship++;
      }
      await drive.write('relationship.json', { items });
    }

    if (body.profile && typeof body.profile === 'object') {
      const profile = await readProfile(drive);
      for (const k of ['ticket1_time', 'ticket2_time']) if (isIso(body.profile[k])) profile[k] = body.profile[k];
      profile.updated_at = new Date().toISOString();
      await drive.write('profile.json', profile);
      result.profile = true;
    }
    return result;
  },
};

// Drive を使わないルート
const NO_DRIVE = new Set(['PUT /api/devices', 'DELETE /api/devices']);

async function handle(request, env) {
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname}`;
  const route = routes[key];
  if (!route) throw new HttpError(404, 'Not Found');

  const bearer = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')?.[1];
  const uid = bearer && (await verifyIdToken(bearer, env.FIREBASE_PROJECT_ID));
  if (!uid) throw new HttpError(401, '認証が必要です。', 'id_token');

  let drive = null;
  if (!NO_DRIVE.has(key)) {
    const driveToken = request.headers.get('X-Drive-Token');
    if (!driveToken) throw new HttpError(401, 'Drive の認証が必要です。', 'drive_token');
    drive = new Drive(driveToken);
  }

  let body = {};
  if (request.method !== 'GET') {
    try {
      body = (await request.json()) ?? {};
    } catch {
      /* ボディなし */
    }
  }
  try {
    return json(await route({ request, env, url, uid, drive, body }));
  } catch (e) {
    if (e instanceof DriveError && (e.status === 401 || e.status === 403)) {
      throw new HttpError(401, 'Drive の認証が失効しました。', 'drive_token');
    }
    throw e;
  }
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
      // トークン等を含み得るため、詳細はログに出さない
      console.error('unhandled error', e?.name);
      return json({ error: 'サーバーエラーが発生しました。' }, 500);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(sendDueNotifications(env));
  },
};

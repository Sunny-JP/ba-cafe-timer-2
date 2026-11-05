// ルーティングと cron。静的ファイルは Static Assets が配信し、/api/* だけここに来る。

import { Drive, DriveError } from './drive.js';
import { forgetAccessToken, getAccessToken, linkDrive, unlinkDrive } from './driveauth.js';
import {
  addCounts,
  addPending,
  countDevices,
  countUsers,
  deleteUserData,
  getCatalog,
  getCounts,
  getBondStats,
  getDevices,
  sendDueNotifications,
  sendTestNotification,
  setBondStats,
  setCatalog,
  setDevices,
  verifyIdToken,
} from './firebase.js';
import { GIFT_EXP } from '../public/data/gifts.js';
import { BOND_EXP, CATEGORY, CHARACTERS, GIFTS, GIFT_NAME, STUDENT_NAME } from './data/gamedata.js';
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

// ---- 統計 (個人を特定しない件数だけを Firestore の stats/counters に加算する) ----

// 「絆 N 以上」に到達したユーザー数を数える閾値
const BOND_THRESHOLDS = [100, 95, 90, 80, 70, 60, 50]; // 各枠の下限(100 / 99〜95 / 94〜90 / 89〜80 …)。降順
const pad2 = (n) => String(n).padStart(2, '0');

function tapKeys(ms) {
  const d = new Date(ms);
  const day = `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
  const jst = new Date(ms + 9 * 3600e3); // 時間帯・曜日は JST で集計する
  return [`tap_d_${day}`, `tap_m_${logicalMonth(ms).replace('-', '')}`, `tap_h_${pad2(jst.getUTCHours())}`, `tap_w_${jst.getUTCDay()}`];
}

// このユーザーの記録から、統計カウンタへの寄与(キャラを登録したか、閾値に届いたか)を求める。
function bondCounts(items) {
  const counts = {};
  const best = new Map(); // char_key -> 最高ランク
  for (const b of items) best.set(b.char_key, Math.max(best.get(b.char_key) ?? 0, b.bond_level));
  for (const [key, level] of best) {
    counts[`bond_n_${key}`] = 1; // 記録数ではなく「登録したことがあるユーザー数」
    // 最高ランクが入る枠だけ数える(97 なら 99〜95 の枠のみ)。BOND_THRESHOLDS は降順
    const t = BOND_THRESHOLDS.find((x) => level >= x);
    if (t) counts[`bond_ge${t}_${key}`] = 1;
  }
  return counts;
}

const knownCharKeys = async (env) =>
  new Set([...CHARACTERS.map((c) => c.key), ...(await getCatalog(env)).characters.map((c) => c.key)]);

// 統計の失敗でユーザーの操作は失敗させない
async function bumpStats(env, deltas) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return;
  try {
    await addCounts(env, deltas);
  } catch {
    /* 統計のみ失敗 */
  }
}

// 絆の統計を、現在の記録に合わせる。前回反映した分(ユーザーごとに保持)との差分だけを加算するので、
// 何度呼んでも二重に数えず、過去にインポートした分も取り込める。
// 未知の char_key は数えない(任意の文字列でカウンタが増えるのを防ぐ)
async function syncBondStats(env, uid, items) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return;
  try {
    const known = await knownCharKeys(env);
    const next = Object.fromEntries(
      Object.entries(bondCounts(items)).filter(([k, n]) => n && known.has(k.replace(/^bond_(?:n|ge\d+)_/, ''))),
    );
    const prev = await getBondStats(env, uid);
    const deltas = {};
    for (const k of new Set([...Object.keys(prev), ...Object.keys(next)])) deltas[k] = (next[k] ?? 0) - (prev[k] ?? 0);
    if (!Object.values(deltas).some(Boolean)) return;
    await addCounts(env, deltas);
    await setBondStats(env, uid, next);
  } catch (e) {
    console.error('sync bond stats failed', e?.message);
  }
}

// ---- 管理画面 ----

const isAdmin = (env, uid) => (env.ADMIN_UIDS ?? '').split(',').some((x) => x.trim() === uid);
const isAdminRoute = (key) => /^\w+ \/api\/admin\//.test(key);

// 管理画面から送られたキャラクターを検証して整形する
function validCatalog(body) {
  const fail = (m) => {
    throw new HttpError(400, m);
  };
  const characters = body?.characters ?? [];
  if (!Array.isArray(characters) || characters.length > 200) fail('データが不正です。');

  const staticKeys = new Set(CHARACTERS.filter((c) => !c.extra).map((c) => c.key));
  const keys = new Set();
  const out = characters.map((c) => {
    if (!/^[a-z0-9_]{1,64}$/.test(c?.key ?? '') || staticKeys.has(c.key) || keys.has(c.key)) fail('キャラクターの key が不正、または重複しています。');
    if (typeof c.name !== 'string' || !c.name.trim() || c.name.length > 64) fail('キャラクター名が不正です。');
    // 日本語名(name)と英語名は必須、中国語・韓国語は任意
    const names = {};
    for (const [lang, required] of [['en', true], ['zh', false], ['ko', false]]) {
      const v = c.names?.[lang]?.trim?.() ?? '';
      if (v.length > 64 || (required && !v)) fail(`名前(${lang})が不正です。`);
      if (v) names[lang] = v;
    }
    if (!Array.isArray(c.gifts) || !c.gifts.length || c.gifts.length > GIFTS.length) fail('好きな贈り物を1つ以上選んでください。');
    const seen = new Set();
    const gifts = c.gifts.map(([i, rate]) => {
      if (!Number.isInteger(i) || i < 0 || i >= GIFTS.length || seen.has(i) || !(rate in GIFT_EXP)) fail(`${c.name} の贈り物指定が不正です。`);
      seen.add(i);
      return [i, rate];
    });
    keys.add(c.key);
    return { key: c.key, name: c.name.trim(), names, gifts };
  });
  return { characters: out };
}

// ---- ハンドラ ----

const routes = {
  // タイマー画面に必要な分だけ。絆の記録は GET /api/relationship で、画面を出したあとに読む
  'GET /api/bootstrap': async ({ drive, url }) => {
    const month = url.searchParams.get('month') ?? logicalMonth(Date.now());
    if (!isMonth(month)) throw new HttpError(400, 'month が不正です。');
    const [profile, taps] = await Promise.all([readProfile(drive), readTaps(drive, month)]);
    return { profile, month, taps, last_tap: await lastTap(drive, month, taps) };
  },

  'GET /api/taps': async ({ drive, url }) => {
    const month = url.searchParams.get('month');
    if (!isMonth(month ?? '')) throw new HttpError(400, 'month が不正です。');
    return { month, taps: await readTaps(drive, month) };
  },

  'POST /api/taps': async ({ drive, env, uid, body, ctx }) => {
    // 再認証待ちで端末に溜めていたタップは、押した時刻と ID を引き継いで保存する(7日以内・未来でないものだけ)
    const queued = typeof body?.id === 'string' && typeof body?.tap_time === 'string' && Number.isFinite(Date.parse(body.tap_time));
    const at = queued ? Date.parse(body.tap_time) : NaN;
    if (queued && (at > Date.now() + 60000 || at < Date.now() - 7 * 864e5 || body.id.length > 64)) {
      throw new HttpError(400, 'tap_time が不正です。');
    }
    const now = queued ? at : Date.now();
    const month = logicalMonth(now);
    const taps = await readTaps(drive, month);
    if (queued) {
      const dup = taps.find((t) => t.id === body.id);
      if (dup) return { tap: dup, scheduled: false }; // 再送されても二重に記録しない
    } else {
      const last = await lastTap(drive, month, taps);
      if (last && now - Date.parse(last.tap_time) < DUPLICATE_WINDOW) throw new HttpError(429, '直前に記録済みです。');
    }
    const tap = { id: queued ? body.id : uuidv7(now), tap_time: new Date(now).toISOString() };
    await drive.write(tapsFile(month), { taps: [...taps, tap].sort((a, b) => (a.tap_time < b.tap_time ? -1 : a.tap_time > b.tap_time ? 1 : 0)) });
    // 統計は応答を待たせず、返したあとに加算する
    ctx.waitUntil(bumpStats(env, Object.fromEntries(tapKeys(now).map((k) => [k, 1]))));
    if (queued) return { tap, scheduled: false };

    // 通知の失敗でタップの記録は失敗させない
    let scheduled = false;
    const sendAt = shouldScheduleNotification(now);
    if (sendAt && env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        await addPending(env, uid, sendAt);
        scheduled = true;
      } catch (e) {
        // 通知予約のみ失敗。タップは記録済みなので握りつぶすが、原因調査のためログは残す
        console.error('schedule notification failed', e?.message);
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

  'GET /api/relationship': async ({ drive, env, uid, ctx }) => {
    const items = await readBonds(drive);
    ctx.waitUntil(syncBondStats(env, uid, [...items])); // 過去にインポートした分の取り込み。応答は待たない
    return { relationship: items.sort(byRecordedDesc) };
  },

  'POST /api/relationship': async ({ drive, env, uid, body }) => {
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
    const next = [...items, item];
    await drive.write('relationship.json', { items: next });
    await syncBondStats(env, uid, next);
    return { item };
  },

  'DELETE /api/relationship': async ({ drive, env, uid, body, url }) => {
    const id = body.id ?? url.searchParams.get('id');
    const items = await readBonds(drive);
    const target = items.find((x) => x.id === id);
    if (!target) throw new HttpError(404, '見つかりません。');
    const next = items.filter((x) => x.id !== id);
    await drive.write('relationship.json', { items: next });
    await syncBondStats(env, uid, next);
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

  'GET /api/catalog': async ({ env }) => (env.FIREBASE_SERVICE_ACCOUNT ? getCatalog(env) : { characters: [] }),

  // ゲームデータ本体。public/ に置かず、ログイン済みのユーザーにだけ配る
  // version は内容のハッシュ。端末は保存済みの version を ?v= で送り、同じなら本体を省く(unchanged)
  'GET /api/gamedata': async ({ env, url }) => {
    const data = {
      bondExp: BOND_EXP,
      gifts: GIFTS,
      characters: CHARACTERS,
      names: { category: CATEGORY, gift: GIFT_NAME, student: STUDENT_NAME },
      catalog: env.FIREBASE_SERVICE_ACCOUNT ? await getCatalog(env) : { characters: [] },
    };
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(JSON.stringify(data)));
    const version = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return url.searchParams.get('v') === version ? { version, unchanged: true } : { version, ...data };
  },

  // 管理者かどうかの確認用 (権限チェックは handle() 側で済んでいる)
  'GET /api/admin/me': async () => ({ ok: true }),

  'GET /api/admin/stats': async ({ env }) => {
    const [counts, catalog, pushUsers, users] = await Promise.all([getCounts(env), getCatalog(env), countDevices(env), countUsers(env)]);

    const series = (prefix, take) =>
      Object.entries(counts)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, count]) => ({ key: k.slice(prefix.length), count }))
        .sort((a, b) => (a.key < b.key ? 1 : -1))
        .slice(0, take);

    const names = new Map([...CHARACTERS.map((c) => [c.key, c.name]), ...catalog.characters.map((c) => [c.key, c.name])]);
    const bonds = [...names]
      .map(([key, name]) => ({
        key,
        name,
        records: Math.max(0, counts[`bond_n_${key}`] ?? 0),
        reached: Object.fromEntries(BOND_THRESHOLDS.map((t) => [t, Math.max(0, counts[`bond_ge${t}_${key}`] ?? 0)])),
      }))
      .filter((b) => b.records !== 0)
      // 100 以上の人数が多い順。同数なら 90 以上、80 以上…の順に比べ、最後は登録ユーザー数
      .sort((a, b) => {
        for (const t of BOND_THRESHOLDS) if (a.reached[t] !== b.reached[t]) return b.reached[t] - a.reached[t];
        return b.records - a.records;
      });

    const dist = (prefix, n, pad) => Array.from({ length: n }, (_, i) => Math.max(0, counts[`${prefix}${pad ? pad2(i) : i}`] ?? 0));
    const totalTaps = Object.entries(counts).reduce((a, [k, v]) => (k.startsWith('tap_m_') ? a + v : a), 0);
    return { users, pushUsers, totalTaps, hourly: dist('tap_h_', 24, true), weekly: dist('tap_w_', 7), daily: series('tap_d_', 30), monthly: series('tap_m_', 12), bonds, thresholds: BOND_THRESHOLDS };
  },

  'POST /api/admin/test-push': async ({ env, uid }) => {
    const result = await sendTestNotification(env, uid);
    if (!result.devices) throw new HttpError(400, 'この管理者アカウントで通知がオンになっていません。アプリ側で通知をオンにしてください。');
    return result;
  },

  // タップのテスト。記録は一切書き込まず、そのタップで何が起きるか(月・統計キー・通知予約)を返す。
  // schedule=true のときだけ、60秒後に自分の端末へ届く通知を実際に予約して cron→FCM の経路まで確かめる
  'POST /api/admin/test-tap': async ({ env, uid, body }) => {
    const at = isIso(body?.tap_time) ? Date.parse(body.tap_time) : Date.now();
    const sendAt = shouldScheduleNotification(at);
    const result = {
      tap_time: new Date(at).toISOString(),
      logical_month: logicalMonth(at),
      stats_keys: tapKeys(at),
      notification: sendAt
        ? { scheduled: true, send_at: new Date(sendAt).toISOString() }
        : { scheduled: false, reason: '次の 4:00 / 16:00 (JST) を跨ぐため予約しません。' },
      service_account: !!env.FIREBASE_SERVICE_ACCOUNT,
      devices: env.FIREBASE_SERVICE_ACCOUNT ? (await getDevices(env, uid)).length : 0,
      queued: null,
    };
    if (body?.schedule) {
      if (!result.devices) throw new HttpError(400, 'この管理者アカウントで通知がオンになっていません。アプリ側で通知をオンにしてください。');
      const when = Date.now() + 60000;
      await addPending(env, uid, when);
      result.queued = new Date(when).toISOString();
    }
    return result;
  },

  'PUT /api/admin/catalog': async ({ env, body }) => {
    // 静的データ(gifts.js)に取り込み済みのキャラがカタログに残っていても、保存できるよう読み飛ばす
    const stored = new Set((await getCatalog(env)).characters.map((c) => c.key));
    const isStatic = (k) => CHARACTERS.some((c) => !c.extra && c.key === k);
    const characters = Array.isArray(body?.characters) ? body.characters.filter((c) => !(stored.has(c?.key) && isStatic(c.key))) : body?.characters;
    const catalog = validCatalog({ ...body, characters });
    await setCatalog(env, catalog);
    return catalog;
  },

  // ブラウザで得た認可コードを渡すと、サーバーがリフレッシュトークンを保管する(以後はトークンの受け渡し不要)
  'POST /api/auth/drive': async ({ env, uid, body }) => {
    if (!(await linkDrive(env, uid, body?.code))) throw new HttpError(400, 'Drive の連携に失敗しました。');
    return { ok: true };
  },

  'DELETE /api/account': async ({ drive, env, uid }) => {
    await drive.removeAll();
    // Drive のデータは消去済み。通知情報の掃除に失敗しても、ユーザーにはエラーを返さない。
    if (env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        await unlinkDrive(env, uid);
        await deleteUserData(env, uid);
      } catch (e) {
        // 秘密情報を含み得るため、自前のメッセージ(firestore 403 など)だけを出す
        const safe = /^(firestore \d+|service account auth failed)$/.test(e?.message) ? e.message : '';
        console.error('deleteUserData failed', e?.name, safe);
      }
    }
    return { ok: true };
  },

  // データの書き出し。形式は POST /api/import がそのまま読み込める (doc/インポートファイル仕様.md)。
  'GET /api/export': async ({ drive }) => {
    const names = [...(await drive.index()).keys()].filter((n) => /^taps-\d{4}-\d{2}\.json$/.test(n)).sort();
    const taps = [];
    for (const n of names) {
      for (const t of (await drive.read(n, { taps: [] })).taps) taps.push({ id: t.id, tap_time: t.tap_time });
    }
    taps.sort((a, b) => (a.tap_time < b.tap_time ? -1 : a.tap_time > b.tap_time ? 1 : 0));
    const profile = await readProfile(drive);
    return {
      schema: 1,
      taps,
      relationship: (await readBonds(drive)).map(({ id, char_key, bond_level, recorded_at, created_at, updated_at }) => ({
        id, char_key, bond_level, recorded_at, created_at, updated_at,
      })),
      profile: { ticket1_time: profile.ticket1_time, ticket2_time: profile.ticket2_time },
    };
  },

  // データのインポート。既存 ID を保持し、不正な行・重複は読み飛ばす。
  'POST /api/import': async ({ drive, env, uid, body }) => {
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
        const item = {
          id: isUuid(b.id) ? b.id : uuidv7(),
          char_key: b.char_key,
          bond_level: b.bond_level,
          recorded_at: b.recorded_at,
          created_at: isIso(b.created_at) ? b.created_at : now,
          updated_at: isIso(b.updated_at) ? b.updated_at : now,
        };
        items.push(item);
        result.relationship++;
      }
      await drive.write('relationship.json', { items });
      await syncBondStats(env, uid, items);
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
const NO_DRIVE = new Set(['PUT /api/devices', 'DELETE /api/devices', 'POST /api/auth/drive', 'GET /api/catalog', 'GET /api/gamedata']);

async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname}`;
  const route = routes[key];
  if (!route) throw new HttpError(404, 'Not Found');

  const bearer = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')?.[1];
  const uid = bearer && (await verifyIdToken(bearer, env.FIREBASE_PROJECT_ID));
  if (!uid) throw new HttpError(401, '認証が必要です。', 'id_token');

  if (isAdminRoute(key) && !isAdmin(env, uid)) throw new HttpError(403, '管理者ではありません。');

  let drive = null;
  if (!NO_DRIVE.has(key) && !isAdminRoute(key)) {
    const driveToken = await getAccessToken(env, uid);
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
    return json(await route({ request, env, ctx, url, uid, drive, body }));
  } catch (e) {
    if (e instanceof DriveError && (e.status === 401 || e.status === 403)) {
      forgetAccessToken(uid); // 失効していたら、次の呼び出しで取り直す
      throw new HttpError(401, 'Drive の認証が失効しました。', 'drive_token');
    }
    throw e;
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await handle(request, env, ctx);
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

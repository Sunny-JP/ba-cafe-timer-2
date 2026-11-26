import { DurableObject } from 'cloudflare:workers';
import { Drive, DriveError, forgetAccessToken, getAccessToken, linkDrive, unlinkDrive } from './drive.js';
import {
  addCounts,
  addPending,
  countDevices,
  countUsers,
  deleteUserData,
  getAdsConfig,
  getBondStats,
  getCatalog,
  getCounts,
  getDevices,
  isAccountActive,
  removePending,
  sendDueNotifications,
  sendTestNotification,
  setAdsConfig,
  setBondStats,
  setCatalog,
  setDevices,
  verifyIdToken,
  warmServiceToken,
} from './firebase.js';
import { BOND_EXP, CATEGORY, CHARACTERS, GIFTS, GIFT_EXP, GIFT_NAME, STUDENT_NAME } from './gamedata.js';
import {
  TICKET_COOLDOWN,
  byTapTime,
  isMonth,
  isValidTimeZone,
  latestTap,
  logicalMonth,
  monthRange,
  nextTapTime,
  padTwo,
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

// 外部のエラー文はトークンを含み得るので、ログに出さない
const safeMessage = (error) =>
  /^(firestore \d+|identitytoolkit \d+|service account auth failed|jwk fetch failed|Drive API \d+)$/.test(error?.message) ? error.message : '';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

const DEFAULT_PROFILE = { ticket1_time: null, ticket2_time: null, timezone: null, updated_at: null };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IMPORT_FROM_DATE = '2025-01-01';
const IMPORT_FROM_TIME = Date.parse(`${IMPORT_FROM_DATE}T00:00:00+09:00`);
const MINUTE = 60 * 1000;
const MAX_BODY_LENGTH = 256 * 1024;
const MAX_IMPORT_LENGTH = 2 * 1024 * 1024;
const MAX_IMPORT_BONDS = 5000;
// 無料プランの通信回数の上限 (1 回 50) に収める。超える分はアプリが分けて送る
const MAX_IMPORT_MONTHS = 12;
const DELETE_FILES_PER_REQUEST = 25;
const EXPORT_MONTHS_PER_REQUEST = 36;
const DAY = 24 * 60 * MINUTE;

const isIsoTime = (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const isUuid = (value) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
const isFcmToken = (value) => typeof value === 'string' && /^[\w:-]{1,4096}$/.test(value);
const byRecordedDesc = (first, second) => (first.recorded_at < second.recorded_at ? 1 : first.recorded_at > second.recorded_at ? -1 : 0);

const tapsFileName = (month) => `taps-${month}.json`;
const readTaps = async (drive, month) => (await drive.read(tapsFileName(month), { taps: [] })).taps;
const readProfile = async (drive) => ({ ...DEFAULT_PROFILE, ...(await drive.read('profile.json', {})) });
const readBonds = async (drive) => (await drive.read('relationship.json', { items: [] })).items;

const findLastTap = async (drive, month, taps) => latestTap(taps.length ? taps : await readTaps(drive, prevMonth(month)));

function bondError(bond) {
  if (typeof bond.char_key !== 'string' || !bond.char_key || bond.char_key.length > 64) return 'char_key が不正です。';
  if (!Number.isInteger(bond.bond_level) || bond.bond_level < 1 || bond.bond_level > 100) return 'bond_level は 1〜100 です。';
  if (!DATE_PATTERN.test(bond.recorded_at ?? '')) return 'recorded_at は YYYY-MM-DD 形式です。';
  return null;
}

const bondKey = (bond) => `${bond.char_key}:${bond.bond_level}`;
const bondExists = (items, bond) => items.some((item) => bondKey(item) === bondKey(bond));

const BOND_THRESHOLDS = [100, 95, 90, 80, 70, 60, 50];

function tapStatKeys(tapTime) {
  const utc = new Date(tapTime);
  const jst = new Date(tapTime + 9 * 60 * MINUTE);
  const day = `${utc.getUTCFullYear()}${padTwo(utc.getUTCMonth() + 1)}${padTwo(utc.getUTCDate())}`;
  return [`tap_d_${day}`, `tap_m_${logicalMonth(tapTime).replace('-', '')}`, `tap_h_${padTwo(jst.getUTCHours())}`, `tap_w_${jst.getUTCDay()}`];
}

function bondStatCounts(items) {
  const counts = {};
  const bestLevel = new Map();
  for (const item of items) bestLevel.set(item.char_key, Math.max(bestLevel.get(item.char_key) ?? 0, item.bond_level));
  for (const [charKey, level] of bestLevel) {
    counts[`bond_n_${charKey}`] = 1;
    const threshold = BOND_THRESHOLDS.find((value) => level >= value);
    if (threshold) counts[`bond_ge${threshold}_${charKey}`] = 1;
  }
  return counts;
}

async function addTapStats(env, tapTime) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return;
  await addCounts(env, Object.fromEntries(tapStatKeys(tapTime).map((statKey) => [statKey, 1]))).catch(() => {});
}

// 前回反映分との差分を足すので、何度呼んでも二重に数えない
async function syncBondStats(env, uid, items) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return;
  try {
    const knownKeys = new Set([...CHARACTERS, ...(await getCatalog(env)).characters].map((character) => character.key));
    const next = Object.fromEntries(
      Object.entries(bondStatCounts(items)).filter(([statKey]) => knownKeys.has(statKey.replace(/^bond_(?:n|ge\d+)_/, ''))),
    );
    const previous = await getBondStats(env, uid);
    const deltas = {};
    for (const statKey of new Set([...Object.keys(previous), ...Object.keys(next)])) deltas[statKey] = (next[statKey] ?? 0) - (previous[statKey] ?? 0);
    if (!Object.values(deltas).some(Boolean)) return;
    await addCounts(env, deltas);
    await setBondStats(env, uid, next);
  } catch (error) {
    console.error('sync bond stats failed', safeMessage(error));
  }
}

const isAdmin = (env, uid) => (env.ADMIN_UIDS ?? '').split(',').some((adminUid) => adminUid.trim() === uid);
const isAdminRoute = (routeKey) => /^\w+ \/api\/admin\//.test(routeKey);
const NO_DEVICE_MESSAGE = 'この管理者アカウントで通知がオンになっていません。アプリ側で通知をオンにしてください。';

function validateCatalog(characters) {
  const fail = (message) => {
    throw new HttpError(400, message);
  };
  if (!Array.isArray(characters) || characters.length > 200) fail('データが不正です。');
  const builtInKeys = new Set(CHARACTERS.filter((character) => !character.extra).map((character) => character.key));
  const usedKeys = new Set();
  return characters.map((character) => {
    const { key, name } = character ?? {};
    if (!/^[a-z0-9_]{1,64}$/.test(key ?? '') || builtInKeys.has(key) || usedKeys.has(key)) fail('キャラクターの key が不正、または重複しています。');
    if (typeof name !== 'string' || !name.trim() || name.length > 64) fail('キャラクター名が不正です。');
    const names = {};
    for (const [lang, required] of [['en', true], ['zh', false], ['ko', false]]) {
      const translated = character.names?.[lang]?.trim?.() ?? '';
      if (translated.length > 64 || (required && !translated)) fail(`名前(${lang})が不正です。`);
      if (translated) names[lang] = translated;
    }
    if (!Array.isArray(character.gifts) || !character.gifts.length || character.gifts.length > GIFTS.length) fail('好きな贈り物を1つ以上選んでください。');
    const seenGifts = new Set();
    const gifts = character.gifts.map(([giftIndex, rate]) => {
      const valid = Number.isInteger(giftIndex) && giftIndex >= 0 && giftIndex < GIFTS.length && !seenGifts.has(giftIndex) && rate in GIFT_EXP;
      if (!valid) fail(`${name} の贈り物指定が不正です。`);
      seenGifts.add(giftIndex);
      return [giftIndex, rate];
    });
    usedKeys.add(key);
    return { key, name: name.trim(), names, gifts };
  });
}

// 新品を扱う正規取扱店の shopCode
const AD_SHOP_CODES = [];
const AD_KEYWORD = 'ブルーアーカイブ';
const AD_NG_KEYWORD = '中古 USED ジャンク';
const AD_SEARCH_API = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';
const AD_CACHE_URL = 'https://cafetimer2.rabbit1.cc/__cache/ads';
const AD_CACHE_SECONDS = 6 * 60 * 60;
const AD_COUNT = 10;

const affiliateLink = (affiliateId, targetUrl) =>
  `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(targetUrl)}&m=${encodeURIComponent(targetUrl)}`;

function sampleAds(env) {
  const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(AD_KEYWORD)}/`;
  const url = env.RAKUTEN_AFFILIATE_ID ? affiliateLink(env.RAKUTEN_AFFILIATE_ID, searchUrl) : searchUrl;
  return Array.from({ length: 8 }, (_, index) => ({ name: `サンプル商品 ${index + 1} ブルーアーカイブ 公式グッズ`, price: 990 * (index + 1), image: '/img/icon.svg', url }));
}

async function searchShop(env, shopCode) {
  const query = new URLSearchParams({
    applicationId: env.RAKUTEN_APP_ID,
    affiliateId: env.RAKUTEN_AFFILIATE_ID ?? '',
    format: 'json',
    formatVersion: '2',
    keyword: AD_KEYWORD,
    NGKeyword: AD_NG_KEYWORD,
    shopCode,
    imageFlag: '1',
    availability: '1',
    hits: '30',
  });
  const response = await fetch(`${AD_SEARCH_API}?${query}`);
  if (!response.ok) throw new Error(`rakuten ${response.status}`);
  const { Items: items = [] } = await response.json();
  return items.map((item) => ({
    name: item.itemName,
    price: item.itemPrice,
    image: (item.mediumImageUrls?.[0] ?? '').replace(/\?_ex=\d+x\d+$/, '?_ex=200x200'),
    url: item.affiliateUrl || item.itemUrl,
  }));
}

// 楽天の API は 1 秒に 1 回まで
async function fetchAds(env, ctx) {
  const cache = caches.default;
  const cached = await cache.match(AD_CACHE_URL);
  if (cached) return cached.json();
  const items = [];
  for (const [index, shopCode] of AD_SHOP_CODES.entries()) {
    if (index) await new Promise((resolve) => setTimeout(resolve, 1100));
    try {
      items.push(...(await searchShop(env, shopCode)));
    } catch (error) {
      console.warn('ads search failed', shopCode, error?.message);
    }
  }
  const usable = items.filter((item) => item.name && item.image.startsWith('https://') && item.url.startsWith('https://'));
  const response = Response.json(usable, { headers: { 'Cache-Control': `max-age=${AD_CACHE_SECONDS}` } });
  ctx.waitUntil(cache.put(AD_CACHE_URL, response));
  return usable;
}

async function adsEnabled(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return false;
  try {
    return (await getAdsConfig(env)).enabled === true;
  } catch (error) {
    console.warn('ads config read failed', safeMessage(error));
    return false;
  }
}

async function handleAds(env, ctx) {
  let items = [];
  const enabled = await adsEnabled(env);
  if (enabled && env.ADS_SAMPLE === '1') items = sampleAds(env);
  else if (enabled && env.RAKUTEN_APP_ID && AD_SHOP_CODES.length) items = await fetchAds(env, ctx);
  const shuffled = items.map((item) => [Math.random(), item]).sort((first, second) => first[0] - second[0]).map(([, item]) => item);
  return json({ items: shuffled.slice(0, AD_COUNT) });
}

// 本体はデプロイまで変わらないので、ハッシュはカタログが変わったときだけ計算し直す
let versionCache = { catalogText: null, version: null };
async function gamedataVersion(catalog, data) {
  const catalogText = JSON.stringify(catalog);
  if (versionCache.catalogText !== catalogText) {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(JSON.stringify(data)));
    versionCache = { catalogText, version: [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('') };
  }
  return versionCache.version;
}

const routes = {
  'GET /api/bootstrap': async ({ drive, env, uid, url }) => {
    const month = url.searchParams.get('month') ?? logicalMonth(Date.now());
    if (!isMonth(month)) throw new HttpError(400, 'month が不正です。');
    const [profile, taps, ads] = await Promise.all([readProfile(drive), readTaps(drive, month), adsEnabled(env)]);
    return { profile, month, taps, last_tap: await findLastTap(drive, month, taps), is_admin: isAdmin(env, uid), ads };
  },

  'GET /api/taps': async ({ drive, url }) => {
    const month = url.searchParams.get('month');
    if (!isMonth(month ?? '')) throw new HttpError(400, 'month が不正です。');
    return { month, taps: await readTaps(drive, month) };
  },

  // 通知の予約は先に始め、別の端末で記録済みなら取り消す
  'POST /api/taps': async ({ drive, env, uid, body, ctx }) => {
    const now = Date.now();
    const hasClientValues = body?.tap_time !== undefined || body?.id !== undefined;
    const tapTime = hasClientValues ? Date.parse(body.tap_time) : now;
    const validClientValues = typeof body?.id === 'string' && /^[0-9A-Za-z-]{1,64}$/.test(body.id) && typeof body.tap_time === 'string' && Number.isFinite(tapTime);
    if (hasClientValues && !validClientValues) throw new HttpError(400, 'tap が不正です。');
    if (tapTime > now + MINUTE || tapTime < now - 7 * DAY) throw new HttpError(400, 'tap_time が不正です。');
    const id = hasClientValues ? body.id : uuidv7(tapTime);

    const sendAt = shouldScheduleNotification(tapTime);
    const scheduling =
      sendAt && sendAt > now && env.FIREBASE_SERVICE_ACCOUNT
        ? addPending(env, uid, sendAt, id).then(
            () => true,
            (error) => {
              console.error('schedule notification failed', safeMessage(error));
              return false;
            },
          )
        : Promise.resolve(false);

    const month = logicalMonth(tapTime);
    const taps = await readTaps(drive, month);
    const recorded = taps.find((tap) => tap.id === id);
    if (recorded) return { tap: recorded, scheduled: await scheduling };

    const overlaps = (tap) => {
      const otherTime = Date.parse(tap.tap_time);
      return tap.id !== id && (otherTime <= tapTime ? tapTime < nextTapTime(otherTime) : otherTime < nextTapTime(tapTime));
    };
    if (taps.some(overlaps)) {
      if (await scheduling) await removePending(env, uid, id).catch((error) => console.error('cancel notification failed', safeMessage(error)));
      throw new HttpError(409, '他の端末で記録済みです。', 'conflict');
    }

    const tap = { id, tap_time: new Date(tapTime).toISOString() };
    await drive.write(tapsFileName(month), { taps: [...taps, tap].sort(byTapTime) });
    ctx.waitUntil(addTapStats(env, tapTime));
    const scheduled = await scheduling;
    return { tap, scheduled, send_at: scheduled ? new Date(sendAt).toISOString() : null };
  },

  'PUT /api/profile': async ({ drive, body }) => {
    const profile = await readProfile(drive);
    const conflicts = [];
    for (const field of ['ticket1_time', 'ticket2_time']) {
      if (!(field in body)) continue;
      if (body[field] !== null && !isIsoTime(body[field])) throw new HttpError(400, `${field} が不正です。`);
      const current = profile[field] && Date.parse(profile[field]);
      const next = body[field] && Date.parse(body[field]);
      if (current && next && next !== current && next < current + TICKET_COOLDOWN) conflicts.push(field);
      else profile[field] = body[field];
    }
    if ('timezone' in body) {
      if (body.timezone !== null && !isValidTimeZone(body.timezone)) throw new HttpError(400, 'timezone が不正です。');
      profile.timezone = body.timezone;
    }
    profile.updated_at = new Date().toISOString();
    await drive.write('profile.json', profile);
    return { profile, conflicts };
  },

  'GET /api/relationship': async ({ drive }) => ({ relationship: (await readBonds(drive)).sort(byRecordedDesc) }),

  'POST /api/relationship': async ({ drive, env, uid, body }) => {
    const error = bondError(body);
    if (error) throw new HttpError(400, error);
    const items = await readBonds(drive);
    if (bondExists(items, body)) throw new HttpError(409, `RANK ${body.bond_level} は既に登録されています。`);
    const now = new Date().toISOString();
    const item = { id: uuidv7(), char_key: body.char_key, bond_level: body.bond_level, recorded_at: body.recorded_at, created_at: now, updated_at: now };
    const next = [...items, item];
    await drive.write('relationship.json', { items: next });
    await syncBondStats(env, uid, next);
    return { item };
  },

  'DELETE /api/relationship': async ({ drive, env, uid, body }) => {
    const items = await readBonds(drive);
    if (!items.some((item) => item.id === body.id)) throw new HttpError(404, '見つかりません。');
    const next = items.filter((item) => item.id !== body.id);
    await drive.write('relationship.json', { items: next });
    await syncBondStats(env, uid, next);
    return { ok: true };
  },

  'PUT /api/devices': async ({ env, uid, body }) => {
    if (!isFcmToken(body.token)) throw new HttpError(400, 'token が不正です。');
    const tokens = await getDevices(env, uid);
    if (!tokens.includes(body.token)) await setDevices(env, uid, [...tokens, body.token].slice(-10));
    return { ok: true };
  },

  'DELETE /api/devices': async ({ env, uid, body }) => {
    if (!isFcmToken(body.token)) throw new HttpError(400, 'token が不正です。');
    const tokens = await getDevices(env, uid);
    await setDevices(env, uid, tokens.filter((token) => token !== body.token));
    return { ok: true };
  },

  'GET /api/catalog': async ({ env }) => (env.FIREBASE_SERVICE_ACCOUNT ? getCatalog(env) : { characters: [] }),

  'GET /api/gamedata': async ({ env, url }) => {
    const catalog = env.FIREBASE_SERVICE_ACCOUNT ? await getCatalog(env) : { characters: [] };
    const data = {
      bondExp: BOND_EXP,
      giftExp: GIFT_EXP,
      gifts: GIFTS,
      characters: CHARACTERS,
      names: { category: CATEGORY, gift: GIFT_NAME, student: STUDENT_NAME },
      catalog,
    };
    const version = await gamedataVersion(catalog, data);
    return url.searchParams.get('v') === version ? { version, unchanged: true } : { version, ...data };
  },

  'GET /api/admin/me': async () => ({ ok: true }),

  'GET /api/admin/ads': async ({ env }) => ({ enabled: (await getAdsConfig(env)).enabled === true }),

  'PUT /api/admin/ads': async ({ env, body }) => {
    if (typeof body?.enabled !== 'boolean') throw new HttpError(400, 'enabled が不正です。');
    await setAdsConfig(env, { enabled: body.enabled });
    return { enabled: body.enabled };
  },

  'GET /api/admin/stats': async ({ env }) => {
    const [counts, catalog, pushUsers, users] = await Promise.all([getCounts(env), getCatalog(env), countDevices(env), countUsers(env)]);
    const count = (statKey) => Math.max(0, counts[statKey] ?? 0);
    const latestSeries = (prefix, limit) =>
      Object.entries(counts)
        .filter(([statKey]) => statKey.startsWith(prefix))
        .map(([statKey, value]) => ({ key: statKey.slice(prefix.length), count: value }))
        .sort((first, second) => (first.key < second.key ? 1 : -1))
        .slice(0, limit);
    const distribution = (prefix, length, padded) => Array.from({ length }, (_, index) => count(`${prefix}${padded ? padTwo(index) : index}`));

    const charNames = new Map([...CHARACTERS, ...catalog.characters].map((character) => [character.key, character.name]));
    const bonds = [...charNames]
      .map(([key, name]) => ({
        key,
        name,
        records: count(`bond_n_${key}`),
        reached: Object.fromEntries(BOND_THRESHOLDS.map((threshold) => [threshold, count(`bond_ge${threshold}_${key}`)])),
      }))
      .filter((bond) => bond.records !== 0)
      .sort((first, second) => {
        for (const threshold of BOND_THRESHOLDS) if (first.reached[threshold] !== second.reached[threshold]) return second.reached[threshold] - first.reached[threshold];
        return second.records - first.records;
      });

    const totalTaps = Object.entries(counts).reduce((sum, [statKey, value]) => (statKey.startsWith('tap_m_') ? sum + value : sum), 0);
    return {
      users,
      pushUsers,
      totalTaps,
      hourly: distribution('tap_h_', 24, true),
      weekly: distribution('tap_w_', 7, false),
      daily: latestSeries('tap_d_', 30),
      monthly: latestSeries('tap_m_', 12),
      bonds,
      thresholds: BOND_THRESHOLDS,
    };
  },

  'POST /api/admin/test-push': async ({ env, uid }) => {
    const result = await sendTestNotification(env, uid);
    if (!result.devices) throw new HttpError(400, NO_DEVICE_MESSAGE);
    return result;
  },

  'POST /api/admin/test-tap': async ({ env, uid, body }) => {
    const tapTime = isIsoTime(body?.tap_time) ? Date.parse(body.tap_time) : Date.now();
    const sendAt = shouldScheduleNotification(tapTime);
    const result = {
      tap_time: new Date(tapTime).toISOString(),
      logical_month: logicalMonth(tapTime),
      stats_keys: tapStatKeys(tapTime),
      notification: sendAt
        ? { scheduled: true, send_at: new Date(sendAt).toISOString() }
        : { scheduled: false, reason: '次の 4:00 / 16:00 (JST) を跨ぐため予約しません。' },
      service_account: !!env.FIREBASE_SERVICE_ACCOUNT,
      devices: env.FIREBASE_SERVICE_ACCOUNT ? (await getDevices(env, uid)).length : 0,
      queued: null,
    };
    if (body?.schedule) {
      if (!result.devices) throw new HttpError(400, NO_DEVICE_MESSAGE);
      const queuedAt = Date.now() + MINUTE;
      await addPending(env, uid, queuedAt);
      result.queued = new Date(queuedAt).toISOString();
    }
    return result;
  },

  // 組み込みに移したキャラがカタログに残っていても保存できるようにする
  'PUT /api/admin/catalog': async ({ env, body }) => {
    const storedKeys = new Set((await getCatalog(env)).characters.map((character) => character.key));
    const isBuiltIn = (key) => CHARACTERS.some((character) => !character.extra && character.key === key);
    const submitted = Array.isArray(body?.characters) ? body.characters.filter((character) => !(storedKeys.has(character?.key) && isBuiltIn(character.key))) : body?.characters ?? [];
    const catalog = { characters: validateCatalog(submitted) };
    await setCatalog(env, catalog);
    return catalog;
  },

  'POST /api/auth/drive': async ({ env, uid, body }) => {
    if (!(await linkDrive(env, uid, body?.code))) throw new HttpError(400, 'Drive の連携に失敗しました。');
    return { ok: true };
  },

  'DELETE /api/account': async ({ drive, env, uid }) => {
    if (!(await drive.removeAll(DELETE_FILES_PER_REQUEST))) return { done: false };
    if (env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        await unlinkDrive(env, uid);
        await deleteUserData(env, uid);
      } catch (error) {
        console.error('deleteUserData failed', error?.name, safeMessage(error));
      }
    }
    return { done: true };
  },

  'GET /api/export': async ({ drive, url }) => {
    const from = url.searchParams.get('from');
    if (from && !isMonth(from)) throw new HttpError(400, 'from が不正です。');
    const months = [...(await drive.index()).keys()]
      .map((fileName) => /^taps-(\d{4}-\d{2})\.json$/.exec(fileName)?.[1])
      .filter((month) => month && (!from || month >= from))
      .sort();
    const taps = [];
    for (const month of months.slice(0, EXPORT_MONTHS_PER_REQUEST)) {
      for (const tap of await readTaps(drive, month)) taps.push({ id: tap.id, tap_time: tap.tap_time });
    }
    const page = { taps: taps.sort(byTapTime), next: months[EXPORT_MONTHS_PER_REQUEST] ?? null };
    if (from) return page;
    const profile = await readProfile(drive);
    const relationship = (await readBonds(drive)).map(({ id, char_key, bond_level, recorded_at, created_at, updated_at }) => ({
      id,
      char_key,
      bond_level,
      recorded_at,
      created_at,
      updated_at,
    }));
    return { schema: 1, ...page, relationship, profile: { ticket1_time: profile.ticket1_time, ticket2_time: profile.ticket2_time } };
  },

  'POST /api/import': async ({ drive, env, uid, body }) => {
    const result = { taps: 0, relationship: 0, skipped: 0, profile: false };
    const latestAllowed = Date.now() + MINUTE;

    const tapsByMonth = new Map();
    for (const tap of Array.isArray(body.taps) ? body.taps : []) {
      const tapTime = isIsoTime(tap?.tap_time) ? Date.parse(tap.tap_time) : NaN;
      if (!(tapTime >= IMPORT_FROM_TIME && tapTime <= latestAllowed)) {
        result.skipped++;
        continue;
      }
      const month = logicalMonth(tapTime);
      const [start, end] = monthRange(month);
      if (tapTime < start || tapTime >= end) continue;
      const normalized = { id: isUuid(tap.id) ? tap.id : uuidv7(tapTime), tap_time: new Date(tapTime).toISOString() };
      tapsByMonth.set(month, [...(tapsByMonth.get(month) ?? []), normalized]);
    }
    if (tapsByMonth.size > MAX_IMPORT_MONTHS) throw new HttpError(413, `一度に取り込めるのは ${MAX_IMPORT_MONTHS} か月分までです。`);
    if (body.relationship?.length > MAX_IMPORT_BONDS) throw new HttpError(413, `絆の記録は ${MAX_IMPORT_BONDS} 件までです。`);
    for (const [month, incoming] of tapsByMonth) {
      const merged = await readTaps(drive, month);
      const knownIds = new Set(merged.map((tap) => tap.id));
      for (const tap of incoming) {
        if (knownIds.has(tap.id)) {
          result.skipped++;
          continue;
        }
        knownIds.add(tap.id);
        merged.push(tap);
        result.taps++;
      }
      await drive.write(tapsFileName(month), { taps: merged.sort(byTapTime) });
    }

    if (Array.isArray(body.relationship)) {
      const items = await readBonds(drive);
      const knownBonds = new Set(items.map(bondKey));
      const now = new Date().toISOString();
      for (const bond of body.relationship) {
        if (bondError(bond || {}) || bond.recorded_at < IMPORT_FROM_DATE || knownBonds.has(bondKey(bond))) {
          result.skipped++;
          continue;
        }
        knownBonds.add(bondKey(bond));
        items.push({
          id: isUuid(bond.id) ? bond.id : uuidv7(),
          char_key: bond.char_key,
          bond_level: bond.bond_level,
          recorded_at: bond.recorded_at,
          created_at: isIsoTime(bond.created_at) ? bond.created_at : now,
          updated_at: isIsoTime(bond.updated_at) ? bond.updated_at : now,
        });
        result.relationship++;
      }
      await drive.write('relationship.json', { items });
      await syncBondStats(env, uid, items);
    }

    if (body.profile && typeof body.profile === 'object') {
      const profile = await readProfile(drive);
      for (const field of ['ticket1_time', 'ticket2_time']) if (isIsoTime(body.profile[field])) profile[field] = body.profile[field];
      profile.updated_at = new Date().toISOString();
      await drive.write('profile.json', profile);
      result.profile = true;
    }
    return result;
  },
};

const WITHOUT_DRIVE = new Set(['PUT /api/devices', 'DELETE /api/devices', 'POST /api/auth/drive', 'GET /api/catalog', 'GET /api/gamedata']);
// Drive のファイルを丸ごと書き換えるので、ユーザーごとに直列にする
const SERIALIZED = new Set(['POST /api/taps', 'PUT /api/profile', 'POST /api/relationship', 'DELETE /api/relationship', 'DELETE /api/account', 'POST /api/import']);
const HEAVY = new Set(['GET /api/export', 'POST /api/import', 'POST /api/auth/drive', 'DELETE /api/account']);

async function execute({ env, ctx, routeKey, uid, body, url }) {
  let drive = null;
  if (!WITHOUT_DRIVE.has(routeKey) && !isAdminRoute(routeKey)) {
    const accessToken = await getAccessToken(env, uid);
    if (!accessToken) throw new HttpError(401, 'Drive の認証が必要です。', 'drive_token');
    drive = new Drive(accessToken, uid);
  }
  try {
    return await routes[routeKey]({ env, ctx, url, uid, drive, body });
  } catch (error) {
    if (error instanceof DriveError && (error.status === 401 || error.status === 403)) {
      forgetAccessToken(uid);
      throw new HttpError(401, 'Drive の認証が失効しました。', 'drive_token');
    }
    throw error;
  }
}

export class UserStore extends DurableObject {
  #queue = Promise.resolve();

  run(routeKey, uid, body, href) {
    const job = this.#queue.then(() => execute({ env: this.env, ctx: this.ctx, routeKey, uid, body, url: new URL(href) }));
    this.#queue = job.catch(() => {});
    return job.then(
      (data) => ({ data }),
      (error) => {
        if (error instanceof HttpError) return { error: { status: error.status, message: error.message, code: error.code } };
        console.error('unhandled error in UserStore', error?.name, safeMessage(error));
        return { error: { status: 500, message: 'サーバーエラーが発生しました。' } };
      },
    );
  }
}

async function readBody(request, limit) {
  const tooLarge = new HttpError(413, 'データが大きすぎます。');
  if (Number(request.headers.get('Content-Length')) > limit) throw tooLarge;
  const text = await request.text();
  if (text.length > limit) throw tooLarge;
  try {
    return JSON.parse(text) ?? {};
  } catch {
    return {};
  }
}

async function handle(request, env, ctx) {
  const url = new URL(request.url);
  const routeKey = `${request.method} ${url.pathname}`;
  if (!routes[routeKey]) throw new HttpError(404, 'Not Found');

  const bearer = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')?.[1];
  if (bearer) warmServiceToken(env);
  const token = bearer && (await verifyIdToken(bearer, env.FIREBASE_PROJECT_ID));
  if (!token) throw new HttpError(401, '認証が必要です。', 'id_token');
  const uid = token.sub;

  if (isAdminRoute(routeKey) && !(isAdmin(env, uid) && (await isAccountActive(env, uid, token.iat)))) {
    throw new HttpError(403, '管理者ではありません。');
  }

  const isRead = request.method === 'GET';
  const limiter = HEAVY.has(routeKey) ? env.HEAVY_LIMIT : isRead ? env.READ_LIMIT : env.WRITE_LIMIT;
  if (limiter && !(await limiter.limit({ key: uid })).success) {
    throw new HttpError(429, '操作が多すぎます。しばらく待ってからやり直してください。', 'rate_limited');
  }
  const body = isRead ? {} : await readBody(request, routeKey === 'POST /api/import' ? MAX_IMPORT_LENGTH : MAX_BODY_LENGTH);

  if (SERIALIZED.has(routeKey) && env.USER_STORE) {
    const result = await env.USER_STORE.get(env.USER_STORE.idFromName(uid)).run(routeKey, uid, body, url.href);
    if (result.error) throw new HttpError(result.error.status, result.error.message, result.error.code);
    return json(result.data);
  }
  return json(await execute({ env, ctx, routeKey, uid, body, url }));
}

export default {
  // 端末が途中で切断しても、書き込みは最後まで処理する
  async fetch(request, env, ctx) {
    try {
      if (request.method === 'GET' && new URL(request.url).pathname === '/api/ads') return await handleAds(env, ctx);
      const work = handle(request, env, ctx);
      if (request.method !== 'GET') ctx.waitUntil(work.catch(() => {}));
      return await work;
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status);
      console.error('unhandled error', error?.name, safeMessage(error));
      return json({ error: 'サーバーエラーが発生しました。' }, 500);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(sendDueNotifications(env));
  },
};

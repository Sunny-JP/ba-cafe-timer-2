// ゲームデータ(絆EXP表・贈物・キャラ・各言語の名前)の読み込み。
// 本体は public/ に置かず、ログイン後に GET /api/gamedata から取得する。
// 取得したものは端末に保存し、次回からは保存分を使ってすぐ始める。裏で version を送って更新を確認し、
// 変わっていれば差し替える。
import { api } from './api.js';
import { loadNames, registerStudentNames } from './i18n.js';
import { loadGameData } from '../data/gifts.js';

const KEY = 'ct.gamedata';
let loading = null;

function apply(data) {
  loadGameData(data);
  loadNames(data.names);
  registerStudentNames(data.catalog.characters);
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY));
    return c?.version && c.data ? c : null;
  } catch {
    return null;
  }
}

function writeCache(version, data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version, data }));
  } catch {
    /* 保存できなくても動作する */
  }
}

// サーバーに問い合わせ、変わっていれば適用して保存する。適用したら true
async function fetchAndApply(cachedVersion) {
  const { version, unchanged, ...data } = await api.gamedata(cachedVersion);
  if (unchanged) return false;
  apply(data);
  writeCache(version, data);
  return true;
}

// 端末に保存したゲームデータがあるか (あれば ensureGameData がすぐ使える)
export const hasGameData = () => !!readCache();

// ログアウト時: 端末に保存したゲームデータを消し、次にログインしたときは取り直す
export function clearGameDataCache() {
  loading = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 消せなくても動作する */
  }
}

// fresh: 保存分を使わず必ず取り直す(管理画面用)。onUpdate: 保存分で始めたあと、裏の確認で内容が変わったときに呼ぶ
export function ensureGameData({ fresh = false, onUpdate } = {}) {
  if (loading) return loading;
  const cached = fresh ? null : readCache();
  let usable = false;
  if (cached) {
    try {
      apply(cached.data);
      usable = true;
    } catch {
      /* 形式が合わなければ保存分は捨てて取り直す */
    }
  }
  if (usable) {
    loading = Promise.resolve();
    fetchAndApply(cached.version)
      .then((changed) => changed && onUpdate?.())
      .catch(() => {}); // 確認に失敗しても保存分のまま使う
  } else {
    loading = fetchAndApply().then(
      () => {},
      (e) => {
        loading = null; // 失敗したら次の呼び出しでやり直す
        throw e;
      },
    );
  }
  return loading;
}

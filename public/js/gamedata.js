// ゲームデータ (絆EXP表・贈物・キャラ・各言語の名前)。本体はサーバー (src/gamedata.js) から取得して端末に保存し、
// 次回は保存分ですぐ始めて、裏で version を確かめて差し替える
import { api } from "./api.js";
import { loadNames, registerStudentNames } from "./i18n.js";

export const BOND_MAX = 100;
// 贈物の画像 img/gifts.png の1コマの大きさ (sprite は左上から右へ数えたコマ番号)
export const SPRITE = { cols: 5, width: 142, height: 112 };
// 好感度の倍率ごとの色 (2.0: 赤 / 1.5: 橙 / 1.0: 青)
export const RATE_COLOR = { 2: "#e5484d", 1.5: "#f5a524", 1: "#3b82f6" };

// 参照は変えずに中身だけ差し替える
export const BOND_EXP = {};
export const GIFT_EXP = {};
export const GIFTS = [];
export const CHARACTERS = [];

const replaceContents = (target, source) => {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, source);
};

export function loadGameData(data) {
  replaceContents(BOND_EXP, data.bondExp);
  replaceContents(GIFT_EXP, data.giftExp);
  GIFTS.splice(0, GIFTS.length, ...data.gifts);
  CHARACTERS.splice(0, CHARACTERS.length, ...data.characters);
  loadNames(data.names);
  applyCatalog(data.catalog);
}

// 管理画面で追加したキャラを後ろに足す。gifts は [GIFTS の番号, 倍率キー]
export function applyCatalog(catalog) {
  for (let index = CHARACTERS.length - 1; index >= 0; index--) if (CHARACTERS[index].extra) CHARACTERS.splice(index, 1);
  for (const character of catalog?.characters ?? []) {
    if (!CHARACTERS.some((existing) => existing.key === character.key)) CHARACTERS.push({ ...character, extra: true });
  }
  registerStudentNames(catalog?.characters);
}

// 好きな贈物を獲得 EXP の高い順に
export function favoriteGifts(character) {
  return (character?.gifts ?? [])
    .map(([giftIndex, rate]) => {
      const gift = GIFTS[giftIndex];
      const mult = GIFT_EXP[rate];
      return gift && mult ? { ...gift, rate, mult, total: gift.exp * mult } : null;
    })
    .filter(Boolean)
    .sort((first, second) => second.total - first.total || (first.sprite ?? 1e9) - (second.sprite ?? 1e9));
}

// ---- 取得と端末への保存 ----

const STORAGE_KEY = "ct.gamedata";
let loading = null;

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.version && saved.data ? saved : null;
  } catch {
    return null;
  }
}

// 変わっていれば反映して保存する。反映したら true
async function fetchAndApply(savedVersion) {
  const { version, unchanged, ...data } = await api.gamedata(savedVersion);
  if (unchanged) return false;
  loadGameData(data);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, data }));
  } catch {}
  return true;
}

export const hasGameData = () => !!readSaved();

export function clearGameDataCache() {
  loading = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// fresh: 保存分を使わず取り直す (管理画面)。onUpdate: 保存分で始めたあと、裏の確認で内容が変わったとき
export function ensureGameData({ fresh = false, onUpdate } = {}) {
  if (loading) return loading;
  const saved = fresh ? null : readSaved();
  if (saved) {
    try {
      loadGameData(saved.data);
      loading = Promise.resolve();
      fetchAndApply(saved.version)
        .then((changed) => changed && onUpdate?.())
        .catch(() => {});
      return loading;
    } catch {}
  }
  loading = fetchAndApply().then(
    () => {},
    (error) => {
      loading = null;
      throw error;
    },
  );
  return loading;
}

import { api } from "./api.js";
import { loadNames, registerStudentNames } from "./i18n.js";

export const BOND_MAX = 100;
const SPRITE = { cols: 5, width: 142, height: 112 };
export const RATE_COLOR = { 2: "#e5484d", 1.5: "#f5a524", 1: "#3b82f6" };

export const spritePosition = (gift) => `--x:${(gift.sprite % SPRITE.cols) * SPRITE.width};--y:${Math.floor(gift.sprite / SPRITE.cols) * SPRITE.height}`;

// import 先が持つ参照を保つため、中身だけ差し替える
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

export function applyCatalog(catalog) {
  for (let index = CHARACTERS.length - 1; index >= 0; index--) if (CHARACTERS[index].extra) CHARACTERS.splice(index, 1);
  for (const character of catalog?.characters ?? []) {
    if (!CHARACTERS.some((existing) => existing.key === character.key)) CHARACTERS.push({ ...character, extra: true });
  }
  registerStudentNames(catalog?.characters);
}

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

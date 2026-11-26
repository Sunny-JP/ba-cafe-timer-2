export const LANGS = [["ja", "日本語"], ["en", "English"], ["ko", "한국어"], ["zh", "中文"]];
const LANG_CODES = LANGS.map(([code]) => code);
const STORAGE_KEY = "ct.lang";

const dictionaries = {};
const loadingLangs = {};
function loadLang(code) {
  if (dictionaries[code]) return Promise.resolve();
  loadingLangs[code] ??= fetch(`/lang/${code}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`lang/${code}.json: HTTP ${response.status}`);
      return response.json();
    })
    .then((dictionary) => (dictionaries[code] = dictionary))
    .finally(() => delete loadingLangs[code]);
  return loadingLangs[code];
}

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANG_CODES.includes(saved)) return saved;
  } catch {}
  const browserLang = (navigator.language || "ja").slice(0, 2).toLowerCase();
  return LANG_CODES.includes(browserLang) ? browserLang : "en";
}

let currentLang = detectLang();
export const getLang = () => currentLang;
await loadLang(currentLang);

export async function setLang(code, persist = true) {
  if (!LANG_CODES.includes(code)) return;
  await loadLang(code);
  currentLang = code;
  try {
    if (persist) localStorage.setItem(STORAGE_KEY, code);
  } catch {}
  applyStatic();
}

export function t(key, vars = {}) {
  const text = dictionaries[currentLang]?.[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

export function applyStatic() {
  document.documentElement.lang = currentLang;
  for (const element of document.querySelectorAll("[data-i18n]")) element.textContent = t(element.dataset.i18n);
  for (const element of document.querySelectorAll("[data-i18n-aria]")) element.setAttribute("aria-label", t(element.dataset.i18nAria));
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("description"));
}

let categoryNames = {};
let giftNames = {};
let studentNameMap = {};

export function loadNames(names) {
  categoryNames = names.category ?? {};
  giftNames = { ...names.gift };
  studentNameMap = { ...names.student };
}

export function registerStudentNames(characters) {
  for (const character of characters ?? []) {
    const english = character.names?.en ?? character.name;
    studentNameMap[character.name] = { en: english, zh: character.names?.zh || english, ko: character.names?.ko || english };
  }
}

export const studentName = (name) => studentNameMap[name]?.[currentLang] ?? name;
export const studentNames = (name) => studentNameMap[name] ?? {};
export const giftName = (name) => giftNames[name]?.[currentLang] ?? name;
export const categoryName = (name) => categoryNames[currentLang]?.[name] ?? name;

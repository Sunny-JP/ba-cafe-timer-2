// 表示言語(日本語 / English / 한국어 / 中文)。キーは UI 文字列、値は言語ごとの訳。
export const LANGS = [['ja', '日本語'], ['en', 'English'], ['ko', '한국어'], ['zh', '中文']];

// 言語ごとの UI 文字列は /lang/<code>.json に分け、使う言語だけを取得する。
// 言語を切り替えたときに、その言語を追加でダウンロードする (取得済みの言語は再取得しない)。
const DICT = {};
const loading = {};
export function loadLang(code) {
  if (DICT[code]) return Promise.resolve();
  loading[code] ??= fetch(`/lang/${code}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`lang/${code}.json: HTTP ${res.status}`);
      return res.json();
    })
    .then((dict) => {
      DICT[code] = dict;
    })
    .finally(() => delete loading[code]); // 失敗しても次の機会にやり直せる
  return loading[code];
}

// 贈物のカテゴリ(花言葉)名・贈物名・生徒名の訳。データ本体はサーバー(src/data/gamedata.js)にあり、
// ログイン後に loadNames() で読み込む。キーは日本語名。
const CATEGORY = { ja: {}, en: {}, ko: {}, zh: {} };

const GIFT_NAME = {};

const STUDENT_NAME = {};

const KEY = 'ct.lang';
const codes = LANGS.map((l) => l[0]);

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (codes.includes(saved)) return saved;
  } catch {
    /* 読めなくても動作する */
  }
  const nav = (navigator.language || 'ja').slice(0, 2).toLowerCase();
  return codes.includes(nav) ? nav : 'en';
}

let lang = detect();
export const getLang = () => lang;

// 最初に使う言語だけを読み込む (読み込み後に import 元のモジュールが動き出す)
await loadLang(lang);

// 指定した言語を読み込んでから切り替える。読み込めなければ例外を投げ、今の言語のまま
export async function setLang(code, persist = true) {
  if (!codes.includes(code)) return;
  await loadLang(code);
  lang = code;
  try {
    if (persist) localStorage.setItem(KEY, code);
  } catch {
    /* 保存できなくても動作する */
  }
  applyStatic();
}

export function t(key, vars = {}) {
  const s = DICT[lang]?.[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function loadNames(names) {
  for (const l of Object.keys(CATEGORY)) CATEGORY[l] = names.category[l] ?? {};
  for (const k of Object.keys(GIFT_NAME)) delete GIFT_NAME[k];
  for (const k of Object.keys(STUDENT_NAME)) delete STUDENT_NAME[k];
  Object.assign(GIFT_NAME, names.gift);
  Object.assign(STUDENT_NAME, names.student);
}

export const studentName = (name) => STUDENT_NAME[name]?.[lang] ?? name;
// 日本語名 -> {en, zh, ko} (管理画面の一覧用)
export const studentNames = (name) => STUDENT_NAME[name] ?? {};

// 管理画面で追加されたキャラの表示名 (name=日本語名、names={en, zh?, ko?})。未入力の言語は英語名で代用
export function registerStudentNames(characters) {
  for (const c of characters ?? []) {
    const en = c.names?.en ?? c.name;
    STUDENT_NAME[c.name] = { en, zh: c.names?.zh || en, ko: c.names?.ko || en };
  }
}
export const giftName = (name) => GIFT_NAME[name]?.[lang] ?? name;
export const categoryName = (name) => CATEGORY[lang][name] ?? name;

// index.html の固定文言。data-i18n=本文 / data-i18n-aria=aria-label
export function applyStatic() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('description'));
}

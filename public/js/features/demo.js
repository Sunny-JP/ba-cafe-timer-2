// デモ画面 (/demo.html) 用の見本データ。使い方ガイドのスクリーンショット用で、画面を見せるだけ (保存・通信は一切しない)。
// 生徒名・贈物・EXP 表はすべて架空のもの。実際のゲームデータ (ログイン後に取得するもの) は使わない。
import { loadGameData } from '../../data/gifts.js';
import { loadNames } from './i18n.js';
import { logicalDay, logicalMonth } from './time.js';

const HOUR = 3600e3;
const LANG_OK = ['ja', 'en', 'ko', 'zh'];

// URL: /demo.html?tab=timer|calendar|bond|settings  &lang=ja|en|ko|zh  &mode=light|dark  &menu=1  &doc=guide  &char=demoA
export const demoParams = new URLSearchParams(location.search);
export const demoLang = LANG_OK.includes(demoParams.get('lang')) ? demoParams.get('lang') : null;

const STUDENTS = [
  ['demoA', 'サンプル生徒A', 'Sample Student A', '샘플 학생 A', '示例学生 A'],
  ['demoB', 'サンプル生徒B', 'Sample Student B', '샘플 학생 B', '示例学生 B'],
  ['demoC', 'サンプル生徒C', 'Sample Student C', '샘플 학생 C', '示例学生 C'],
  ['demoD', 'サンプル生徒D', 'Sample Student D', '샘플 학생 D', '示例学生 D'],
];
const CATEGORIES = [
  ['キンセンカ', 'Calendula', '금잔화', '金盏花'],
  ['スイセン', 'Narcissus', '수선화', '水仙'],
  ['アサガオ', 'Morning Glory', '나팔꽃', '牵牛花'],
];

function gameData() {
  const bondExp = {};
  for (let l = 1; l <= 100; l++) bondExp[l] = Math.round(1.7 * (l - 1) ** 2.45);
  const gifts = Array.from({ length: 12 }, (_, i) => ({
    name: `サンプル贈物${i + 1}`,
    category: CATEGORIES[i % 3][0],
    exp: 120,
    sprite: i,
  }));
  const rates = ['ss', 'sa', 'sa', 'na', 'nb', 'nb', 'nb', 'nb'];
  const characters = STUDENTS.map(([key, name], n) => ({
    key,
    name,
    gifts: rates.map((r, i) => [(i + n * 2) % 12, r]),
  }));
  const names = {
    category: { ja: {}, en: {}, ko: {}, zh: {} },
    gift: {},
    student: {},
  };
  CATEGORIES.forEach(([ja, en, ko, zh]) => {
    names.category.en[ja] = en;
    names.category.ko[ja] = ko;
    names.category.zh[ja] = zh;
  });
  gifts.forEach((g, i) => {
    const n = i + 1;
    names.gift[g.name] = { en: `Sample Gift ${n}`, ko: `샘플 선물 ${n}`, zh: `示例礼物${n}` };
  });
  STUDENTS.forEach(([, ja, en, ko, zh]) => (names.student[ja] = { en, ko, zh }));
  return { bondExp, gifts, characters, names };
}

// 当月 (論理日 4:00 JST 区切り) のタップを、1日に3回ずつ並べる。直近は「今から約50分前」にして、カウントダウンが動く画面にする
function monthTaps(now) {
  const month = logicalMonth(now);
  const [y, m] = month.split('-').map(Number);
  const today = logicalDay(now);
  const taps = [];
  for (let d = 1; d <= 31; d++) {
    const key = `${month}-${String(d).padStart(2, '0')}`;
    if (key > today) break;
    // 論理日の 4:00 JST = 前日 19:00 UTC
    const start = Date.UTC(y, m - 1, d, 4, 0, 0) - 9 * HOUR;
    for (const [i, off] of [[0, 0.6], [1, 7.1], [2, 12.8]]) {
      const ms = start + off * HOUR + d * 60e3 * (i + 1);
      if (ms < now - 50 * 60e3) taps.push({ id: `demo-${key}-${i}`, tap_time: new Date(ms).toISOString() });
    }
  }
  taps.push({ id: 'demo-last', tap_time: new Date(now - 50 * 60e3).toISOString() });
  return taps;
}

function relationship(now) {
  const items = [];
  const add = (char_key, level, daysAgo) => {
    const ms = now - daysAgo * 24 * HOUR;
    const d = new Date(ms + 9 * HOUR);
    const recorded_at = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    items.push({ id: `demo-${char_key}-${level}`, char_key, bond_level: level, recorded_at, created_at: d.toISOString(), updated_at: d.toISOString() });
  };
  // 見本の推移 (緩やかに上がり、ときどき一気に上がる)
  [[40, 170], [46, 150], [50, 130], [55, 118], [60, 100], [64, 88], [68, 74], [72, 61], [74, 49], [78, 36], [81, 24], [83, 15], [85, 9], [86, 5]].forEach(([l, d]) => add('demoA', l, d));
  [[20, 90], [30, 60], [41, 30]].forEach(([l, d]) => add('demoB', l, d));
  return items;
}

// app.js の state に見本を入れる (通信しない)
export function applyDemo(state) {
  const now = Date.now();
  const data = gameData();
  loadGameData({ ...data, catalog: { characters: [] } });
  loadNames(data.names);
  const taps = monthTaps(now);
  const tab = ['timer', 'calendar', 'bond', 'settings', 'doc'].includes(demoParams.get('tab')) ? demoParams.get('tab') : 'timer';
  Object.assign(state, {
    user: { displayName: 'Sensei', email: 'sensei@example.com', photoURL: null },
    tab,
    doc: demoParams.get('doc') || 'guide',
    profile: { ticket1_time: new Date(now - 5 * HOUR).toISOString(), ticket2_time: new Date(now - 30 * HOUR).toISOString(), timezone: null },
    lastTap: taps.at(-1),
    monthTaps: taps,
    calMonth: logicalMonth(now),
    calTaps: taps,
    selectedDay: logicalDay(now),
    relationship: relationship(now),
    bondChar: STUDENTS.some(([k]) => k === demoParams.get('char')) ? demoParams.get('char') : 'demoA',
    bondReady: true,
    loading: false,
  });
  if (['light', 'dark'].includes(demoParams.get('mode'))) state.mode = demoParams.get('mode');
}

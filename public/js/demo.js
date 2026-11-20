// /demo.html の見本データ (使い方ガイドの画面写真用)。生徒名・贈物・EXP 表はすべて架空のもので、保存・通信はしない
import { loadGameData } from './gamedata.js';
import { logicalDay, logicalMonth } from './time.js';

const HOUR = 3600e3;
const MINUTE = 60e3;
const DEMO_LANGS = ['ja', 'en', 'ko', 'zh'];

// URL: /demo.html?tab=timer|calendar|bond|settings  &lang=ja|en|ko|zh  &mode=light|dark  &menu=1  &doc=guide  &char=demoA
export const demoParams = new URLSearchParams(location.search);
export const demoMenu = !!demoParams.get('menu');
export const demoLang = DEMO_LANGS.includes(demoParams.get('lang')) ? demoParams.get('lang') : null;

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
  for (let rank = 1; rank <= 100; rank++) bondExp[rank] = Math.round(1.7 * (rank - 1) ** 2.45);
  const gifts = Array.from({ length: 12 }, (_, index) => ({ name: `サンプル贈物${index + 1}`, category: CATEGORIES[index % 3][0], exp: 120, sprite: index }));
  const rates = ["ss", "sa", "sa", "na", "nb", "nb", "nb", "nb"];
  const characters = STUDENTS.map(([key, name], studentIndex) => ({
    key,
    name,
    gifts: rates.map((rate, giftOrder) => [(giftOrder + studentIndex * 2) % 12, rate]),
  }));
  const names = { category: { ja: {}, en: {}, ko: {}, zh: {} }, gift: {}, student: {} };
  for (const [ja, en, ko, zh] of CATEGORIES) {
    names.category.en[ja] = en;
    names.category.ko[ja] = ko;
    names.category.zh[ja] = zh;
  }
  gifts.forEach((gift, index) => (names.gift[gift.name] = { en: `Sample Gift ${index + 1}`, ko: `샘플 선물 ${index + 1}`, zh: `示例礼物${index + 1}` }));
  for (const [, ja, en, ko, zh] of STUDENTS) names.student[ja] = { en, ko, zh };
  return { bondExp, giftExp: { nb: 1, na: 1.5, ns: 2, sa: 1.5, ss: 2 }, gifts, characters, names, catalog: { characters: [] } };
}

// 当月のタップを1日3回ずつ並べる。最後は約50分前にして、カウントダウンが動く画面にする
function monthTaps(now) {
  const month = logicalMonth(now);
  const [year, monthNumber] = month.split("-").map(Number);
  const today = logicalDay(now);
  const recentLimit = now - 50 * MINUTE;
  const taps = [];
  for (let date = 1; date <= 31; date++) {
    const day = `${month}-${String(date).padStart(2, "0")}`;
    if (day > today) break;
    const dayStart = Date.UTC(year, monthNumber - 1, date, 4) - 9 * HOUR;
    for (const [order, hoursAfterStart] of [[0, 0.6], [1, 7.1], [2, 12.8]]) {
      const tapTime = dayStart + hoursAfterStart * HOUR + date * MINUTE * (order + 1);
      if (tapTime < recentLimit) taps.push({ id: `demo-${day}-${order}`, tap_time: new Date(tapTime).toISOString() });
    }
  }
  taps.push({ id: "demo-last", tap_time: new Date(recentLimit).toISOString() });
  return taps;
}

// 見本の絆の推移 (緩やかに上がり、ときどき一気に上がる)。[ランク, 何日前]
const BOND_HISTORY = {
  demoA: [[40, 170], [46, 150], [50, 130], [55, 118], [60, 100], [64, 88], [68, 74], [72, 61], [74, 49], [78, 36], [81, 24], [83, 15], [85, 9], [86, 5]],
  demoB: [[20, 90], [30, 60], [41, 30]],
};

function relationship(now) {
  return Object.entries(BOND_HISTORY).flatMap(([charKey, history]) =>
    history.map(([level, daysAgo]) => {
      const recordedAt = new Date(now - daysAgo * 24 * HOUR + 9 * HOUR);
      const isoDate = recordedAt.toISOString();
      return { id: `demo-${charKey}-${level}`, char_key: charKey, bond_level: level, recorded_at: isoDate.slice(0, 10), created_at: isoDate, updated_at: isoDate };
    }),
  );
}

export function applyDemo(state) {
  const now = Date.now();
  loadGameData(gameData());
  const taps = monthTaps(now);
  const requestedTab = demoParams.get("tab");
  const requestedChar = demoParams.get("char");
  Object.assign(state, {
    user: { displayName: "Sensei", email: "sensei@example.com", photoURL: null },
    tab: ["timer", "calendar", "bond", "settings", "doc"].includes(requestedTab) ? requestedTab : "timer",
    doc: demoParams.get("doc") || "guide",
    profile: { ticket1_time: new Date(now - 5 * HOUR).toISOString(), ticket2_time: new Date(now - 30 * HOUR).toISOString(), timezone: null },
    lastTap: taps.at(-1),
    monthTaps: taps,
    calMonth: logicalMonth(now),
    calTaps: taps,
    selectedDay: logicalDay(now),
    relationship: relationship(now),
    bondChar: STUDENTS.some(([key]) => key === requestedChar) ? requestedChar : "demoA",
    bondReady: true,
    loading: false,
  });
  if (["light", "dark"].includes(demoParams.get("mode"))) state.mode = demoParams.get("mode");
}

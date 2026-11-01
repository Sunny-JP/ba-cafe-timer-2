// 起動・タブ切替・状態管理。
import { ReauthRequired, login, logout, onUser } from './auth.js';
import { api } from './api.js';
import { applyStatic, getLang, setLang, t } from './i18n.js';
import { disablePush, enablePush, pushEnabled, pushSupported } from './push.js';
import { BOND_EXP, BOND_MAX, CHARACTERS } from '../data/gifts.js';
import { logicalMonth, nextMonth, prevMonth, uuidv7 } from './time.js';
import {
  DEFAULT_ACCENT,
  MODES,
  WEEKDAYS,
  bondRecords,
  dayCounts,
  heatLevel,
  icon,
  renderBond,
  renderCalendar,
  renderDoc,
  renderMenu,
  renderSettings,
  renderTimer,
  tick,
} from './views.js';

// CALENDAR_LIMITS.MIN: 旧実装の new Date(2025, 12, 1) は 2026-01-01。意図の確認待ち(設計書 §15)
const CAL_MIN = '2026-01';

const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const toast = (msg) => {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 3500);
};

// 処理中の表示。モーダルなので背面の操作はできず、Esc でも閉じない。
const busy = {
  show(msg, step = 0) {
    const dlg = $('#busy');
    if (!dlg.open) dlg.showModal();
    $('#busy-msg').textContent = msg;
    $('#busy-bar').value = step;
  },
  hide: () => $('#busy').close(),
};
$('#busy').addEventListener('cancel', (e) => e.preventDefault());

// 取り込み・消去の前に、メニューを閉じてタイマー画面へ戻る
function toTimerScreen() {
  if ($('#menu').open) $('#menu').close();
  state.tab = 'timer';
  render(true);
  scrollTo(0, 0);
}

// ブラウザ標準の confirm の代わりに使う独自の確認ダイアログ
function confirmDialog(message, okLabel, danger = false) {
  const dlg = $('#confirm');
  $('#confirm-msg').textContent = message;
  const ok = $('#confirm-ok');
  ok.textContent = okLabel;
  ok.classList.toggle('danger', danger);
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise((resolve) => {
    const done = (v) => {
      dlg.close(v ? 'ok' : '');
    };
    ok.onclick = () => done(true);
    $('#confirm-cancel').onclick = () => done(false);
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
  });
}

const store = {
  get(k, fallback, allowed) {
    try {
      const v = localStorage.getItem(`ct.${k}`);
      return allowed ? (allowed.includes(v) ? v : fallback) : (v ?? fallback);
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(`ct.${k}`, v);
    } catch {
      /* 保存できなくても動作する */
    }
  },
};

const state = {
  mode: store.get('mode', 'auto', MODES),
  accent: /^#[0-9a-f]{6}$/i.test(store.get('accent', '', null) ?? '') ? store.get('accent', '', null) : DEFAULT_ACCENT,
  user: null,
  tab: 'timer',
  profile: { ticket1_time: null, ticket2_time: null, timezone: null },
  lastTap: null,
  monthTaps: [], // 当月のタップ (タイマーの枠表示用)
  bondChar: store.get('char', CHARACTERS[0].key, CHARACTERS.map((c) => c.key)),
  bondLevel: null,
  bondDate: null,
  relationship: [],
  calMonth: logicalMonth(Date.now()),
  calTaps: [],
  calLoading: false,
  selectedDay: null,
  pushSupported: pushSupported(),
  pushOn: pushEnabled(),
};

const wide = matchMedia('(min-width: 900px) and (orientation: landscape)');

function render(animate = false) {
  state.calAtMin = state.calMonth <= CAL_MIN;
  state.calAtMax = state.calMonth >= logicalMonth(Date.now());
  // 横長の画面ではタイマーとカレンダーを並べて表示する(カレンダーのタブは隠れる)
  const tab = wide.matches && state.tab === 'calendar' ? 'timer' : state.tab;
  view.innerHTML =
    tab === 'timer' && wide.matches
      ? `<div class="cols"><div>${renderTimer(state)}</div><div>${renderCalendar(state)}</div></div>`
      : { timer: renderTimer, calendar: renderCalendar, bond: renderBond, settings: renderSettings, doc: renderDoc }[tab](state);
  if ($('#menu').open) renderMenuBody();
  tick(view);
  for (const b of document.querySelectorAll('nav button')) b.setAttribute('aria-selected', b.dataset.tab === tab);
  drawChart();
  updateGiftNav();
  if (animate) {
    // 画面遷移時だけ短いフェードイン(再描画のたびには動かさない)
    view.classList.remove('enter');
    void view.offsetWidth;
    view.classList.add('enter');
  }
}

// 贈物の一覧に続きがあるとき、端のぼかしと矢印で横スクロールできることを示す
function updateGiftNav() {
  for (const wrap of document.querySelectorAll('.gifts-wrap')) {
    const list = wrap.querySelector('.gifts');
    const left = list.scrollLeft > 1;
    const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
    wrap.querySelector('.prev').classList.toggle('show', left);
    wrap.querySelector('.next').classList.toggle('show', right);
    list.dataset.fade = (left ? 'l' : '') + (right ? 'r' : '');
  }
}
document.addEventListener('scroll', (e) => e.target.classList?.contains('gifts') && updateGiftNav(), true);
addEventListener('resize', updateGiftNav);

// テーマ色(light-dark() 解決後)を取得する
const css = (name) => {
  const el = document.createElement('div');
  el.style.color = `var(${name})`;
  document.body.append(el);
  const c = getComputedStyle(el).color;
  el.remove();
  const px = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  px.fillStyle = c;
  px.fillRect(0, 0, 1, 1);
  const [r, g, b] = px.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
};

// 絆ランクの推移。最後の記録から平均ペースで RANK 100 まで延ばした予測を点線で重ねる。
let chart = null;
// 横方向で最も近い点を拾う。0番(補助点を含む描画用の線)は対象にせず、同じ位置の点は全て返す。
function registerRealNearest() {
  if (Chart.Interaction.modes.realNearest) return;
  Chart.Interaction.modes.realNearest = (c, e) => {
    let best = Infinity;
    let items = [];
    c.data.datasets.forEach((_ds, di) => {
      if (di === 0 || !c.isDatasetVisible(di)) return;
      c.getDatasetMeta(di).data.forEach((el, index) => {
        const d = Math.abs(el.x - e.x);
        if (d < best - 0.5) {
          best = d;
          items = [{ element: el, datasetIndex: di, index }];
        } else if (Math.abs(d - best) <= 0.5) {
          items.push({ element: el, datasetIndex: di, index });
        }
      });
    });
    return items;
  };
}
function drawChart() {
  chart?.destroy();
  chart = null;
  const canvas = $('#chart');
  if (!canvas || !window.Chart) return;
  registerRealNearest();
  const day = (s) => Date.parse(`${s}T00:00:00Z`);
  const pts = bondRecords(state, state.bondChar)
    .map((b) => ({ x: day(b.recorded_at), y: BOND_EXP[b.bond_level], rank: b.bond_level })) // 縦軸は累計EXP
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (!pts.length) return;
  // 同じ日に複数記録がある日は、上下に補助点(同じ x)を足す。曲線がその日の縦線に垂直に出入りし、角で横に膨らまない。
  const line = [];
  for (let i = 0; i < pts.length; ) {
    let j = i;
    while (j + 1 < pts.length && pts[j + 1].x === pts[i].x) j++;
    const lo = pts[i];
    const hi = pts[j];
    const near = (a, b) => Math.min(BOND_EXP[100] * 0.02, Math.abs(a - b) / 2);
    if (j > i && i > 0) line.push({ x: lo.x, y: lo.y - near(lo.y, pts[i - 1].y), helper: true });
    line.push(...pts.slice(i, j + 1));
    if (j > i && j + 1 < pts.length) line.push({ x: hi.x, y: hi.y + near(pts[j + 1].y, hi.y), helper: true });
    i = j + 1;
  }
  const first = pts[0];
  const last = pts.at(-1);
  const rate = last.x > first.x ? (last.y - first.y) / (last.x - first.x) : 0;
  const maxExp = BOND_EXP[100];
  // 予測は現在のランクより上の、5の倍数ランクごとに点を置く(最後は RANK 100)
  const proj = [];
  if (rate > 0 && last.y < maxExp) {
    proj.push(last);
    for (let l = 5; l <= 100; l += 5) {
      if (BOND_EXP[l] > last.y) proj.push({ x: last.x + (BOND_EXP[l] - last.y) / rate, y: BOND_EXP[l], rank: l, forecast: true });
    }
  }
  const ymd = (ms) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
  };
  const primary = css('--primary');
  const grid = css('--outline');
  const text = css('--on-variant');
  const ym = (ms) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          data: line,
          tension: 0.25,
          borderColor: primary,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: 'origin',
          backgroundColor: ({ chart: c }) => {
            const a = c.chartArea;
            if (!a) return 'transparent';
            const g = c.ctx.createLinearGradient(0, a.top, 0, a.bottom);
            g.addColorStop(0, primary.replace('rgb(', 'rgba(').replace(')', ', .35)'));
            g.addColorStop(1, 'transparent');
            return g;
          },
        },
        // 当たり判定専用: 実際の記録だけを持ち、線は描かない(補助点を含む上の線は対象外)
        { data: pts, showLine: false, borderWidth: 0, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: primary },
        {
          data: proj,
          borderColor: primary,
          borderDash: [6, 5],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: primary,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: false,
      // ホバー(スマホではタップ)で最も近い点を拾い、小ウインドウが追従する
      interaction: { mode: 'realNearest', axis: 'x', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: css('--on-surface'),
          titleColor: css('--surface'),
          bodyColor: css('--surface'),
          padding: 10,
          displayColors: false,
          mode: 'realNearest',
          intersect: false,
          axis: 'x',
          position: 'nearest',
          filter: (_it, i) => i === 0, // 候補が複数あっても1つの小ウインドウにまとめる
          callbacks: {
            title: ([it]) => `${ymd(it.raw.x)}${it.raw.forecast ? ` (${t('forecast')})` : ''}`,
            // 同じ日の記録を、ランクが高い順に1行ずつ表示する
            label: (it) => {
              const ranks = new Map();
              for (const p of [...pts, ...proj]) if (p.x === it.raw.x) ranks.set(p.rank, p);
              return [...ranks.values()]
                .sort((a, b) => b.rank - a.rank)
                .map((p) => `RANK ${p.rank}  /  EXP ${p.y.toLocaleString()}`);
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: first.x,
          max: proj.length ? proj.at(-1).x : last.x + 30 * 864e5,
          grid: { color: grid },
          ticks: { color: text, callback: (v) => ym(v) },
          afterBuildTicks(scale) {
            // 月初に目盛りを置き、多すぎる場合は間引く
            const out = [];
            const d = new Date(scale.min);
            d.setUTCDate(1);
            d.setUTCHours(0, 0, 0, 0);
            for (; d.getTime() <= scale.max; d.setUTCMonth(d.getUTCMonth() + 1)) {
              if (d.getTime() >= scale.min) out.push({ value: d.getTime() });
            }
            const step = Math.ceil(out.length / 6) || 1;
            scale.ticks = out.filter((_, i) => i % step === 0);
          },
        },
        y: {
          min: 0,
          max: maxExp,
          grid: { color: grid },
          ticks: { color: text, callback: (v) => Object.keys(BOND_EXP).find((l) => BOND_EXP[l] === v) ?? '' },
          afterBuildTicks(scale) {
            scale.ticks = [1, 50, 60, 70, 80, 90, 100].map((l) => ({ value: BOND_EXP[l] }));
          },
        },
      },
    },
  });
}

// 表示中の月のカレンダーを PNG として保存
function saveCalendarImage() {
  const [y, m] = state.calMonth.split('-').map(Number);
  const counts = dayCounts(state.calTaps);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const rows = Math.ceil((lead + days) / 7);
  const cell = 120;
  const pad = 24;
  const top = 120;
  const W = cell * 7 + pad * 2;
  const H = top + cell * rows + pad;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d');
  const font = '"Noto Sans", "Noto Sans JP", sans-serif';
  c.fillStyle = css('--surface');
  c.fillRect(0, 0, W, H);
  c.textAlign = 'center';
  c.fillStyle = css('--on-surface');
  c.font = `500 44px ${font}`;
  c.fillText(`${y}. ${m}`, W / 2, 56);
  c.font = `500 22px ${font}`;
  c.fillStyle = css('--on-variant');
  WEEKDAYS.forEach((w, i) => c.fillText(w, pad + cell * i + cell / 2, 100));
  for (let d = 1; d <= days; d++) {
    const i = lead + d - 1;
    const x = pad + (i % 7) * cell + 4;
    const yy = top + Math.floor(i / 7) * cell + 4;
    const n = counts[`${state.calMonth}-${String(d).padStart(2, '0')}`] ?? 0;
    const lv = heatLevel(n);
    c.fillStyle = css('--container');
    c.beginPath();
    c.roundRect(x, yy, cell - 8, cell - 8, 12);
    c.fill();
    c.globalAlpha = lv / 8;
    c.fillStyle = css('--primary');
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = css(lv >= 5 ? '--on-primary' : '--on-surface');
    c.textAlign = 'left';
    c.font = `400 22px ${font}`;
    c.fillText(String(d), x + 10, yy + 30);
    if (n) {
      c.textAlign = 'right';
      c.font = `500 40px ${font}`;
      c.fillText(String(n), x + cell - 18, yy + cell - 22);
    }
  }
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cafetimer-${state.calMonth}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

const dark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (state.mode === 'auto' ? dark.matches : state.mode === 'dark');

function renderMenuBody() {
  $('#menu-body').innerHTML = renderMenu(state);
}

function applyTheme() {
  const root = document.documentElement;
  if (state.mode === 'auto') root.removeAttribute('data-mode');
  else root.dataset.mode = state.mode;
  root.style.setProperty('--accent', state.accent);
  $('#theme-btn').innerHTML = icon(isDark() ? 'sun' : 'moon');
  $('#theme-btn').setAttribute('aria-label', t(isDark() ? 'toLight' : 'toDark'));
}

// 文書は言語ごとのファイル(content.<lang>.html)。訳がない文書は日本語版を注記付きで出す
const docCache = {};
async function fetchDocs(lang) {
  docCache[lang] ??= fetch(lang === 'ja' ? '/content.html' : `/content.${lang}.html`)
    .then((r) => (r.ok ? r.text() : ''))
    .then((html) => {
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      return tpl.content;
    })
    .catch(() => document.createDocumentFragment());
  return docCache[lang];
}
async function loadDoc(id) {
  const lang = getLang();
  const own = (await fetchDocs(lang)).querySelector(`#${id}`);
  if (own) return own.innerHTML;
  const ja = (await fetchDocs('ja')).querySelector(`#${id}`);
  return `<p class="note info">${t('docFallback')}</p>${ja?.innerHTML ?? ''}`;
}

function show(screen) {
  for (const id of ['loading', 'login', 'app']) $(`#${id}`).hidden = id !== screen;
}

// API 呼び出しの共通エラー処理。再認証が必要ならバナーを出す。
async function guarded(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ReauthRequired) $('#reauth').hidden = false;
    else toast(e.message);
    return undefined;
  }
}

async function loadAll() {
  const data = await guarded(() => api.bootstrap(logicalMonth(Date.now())));
  if (!data) return;
  Object.assign(state, {
    profile: data.profile,
    lastTap: data.last_tap,
    monthTaps: data.taps,
    relationship: data.relationship,
    calMonth: data.month,
    calTaps: data.taps,
  });
  render();
}

async function loadCalendar(month) {
  state.calMonth = month;
  state.selectedDay = null;
  state.calLoading = true;
  render(true);
  const data = await guarded(() => api.taps(month));
  state.calLoading = false;
  if (data && data.month === state.calMonth) state.calTaps = data.taps;
  render();
}

async function saveProfile(patch) {
  const before = state.profile;
  state.profile = { ...before, ...patch };
  render();
  const data = await guarded(() => api.saveProfile(patch));
  state.profile = data ? data.profile : before;
  render();
}

const actions = {
  async tap() {
    const prev = { lastTap: state.lastTap, monthTaps: state.monthTaps, calTaps: state.calTaps };
    const temp = { id: uuidv7(), tap_time: new Date().toISOString() };
    const onCurrent = state.calMonth === logicalMonth(Date.now());
    state.lastTap = temp; // 楽観的更新
    state.monthTaps = [...state.monthTaps, temp];
    if (onCurrent) state.calTaps = state.monthTaps;
    render();
    const data = await guarded(() => api.tap());
    if (data) {
      state.lastTap = data.tap;
      state.monthTaps = state.monthTaps.map((t) => (t === temp ? data.tap : t));
      if (onCurrent) state.calTaps = state.monthTaps;
      if (!data.scheduled && state.pushOn) toast(t('noPushSchedule'));
    } else {
      Object.assign(state, prev);
    }
    render();
  },
  'ticket-use': (b) => saveProfile({ [`ticket${b.dataset.n}_time`]: new Date().toISOString() }),
  'dd-toggle'(b) {
    const list = b.nextElementSibling;
    const open = !list.classList.contains('open');
    closeDropdowns();
    list.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  },
  'dd-pick'(b) {
    closeDropdowns();
    const { field, value } = b.dataset;
    if (field === 'char') {
      state.bondChar = value;
      state.bondLevel = null;
      store.set('char', value);
      render();
    } else if (field === 'tz') {
      saveProfile({ timezone: value || null });
    } else if (field === 'lang') {
      setLang(value);
      applyTheme();
      (state.tab === 'doc' ? loadDoc(state.doc) : Promise.resolve(null)).then((html) => {
        if (html !== null) state.docHtml = html;
        render();
      });
    }
  },
  'gifts-scroll'(b) {
    const list = b.parentElement.querySelector('.gifts');
    list.scrollBy({ left: Number(b.dataset.dir) * list.clientWidth * 0.8, behavior: 'smooth' });
  },
  'save-image': saveCalendarImage,
  'theme-toggle'() {
    state.mode = isDark() ? 'light' : 'dark';
    store.set('mode', state.mode);
    applyTheme();
    render();
  },
  'cal-prev': () => loadCalendar(prevMonth(state.calMonth)),
  'cal-next': () => loadCalendar(nextMonth(state.calMonth)),
  day(b) {
    state.selectedDay = b.dataset.day;
    render();
  },
  async 'bond-del'(b) {
    if (!(await confirmDialog(t('confirmDelBond'), t('del'), true))) return;
    if (await guarded(() => api.deleteBond(b.dataset.id))) {
      state.relationship = state.relationship.filter((x) => x.id !== b.dataset.id);
      state.bondLevel = null;
      render();
    }
  },
  async push() {
    await guarded(async () => {
      if (state.pushOn) await disablePush();
      else await enablePush();
      state.pushOn = pushEnabled();
    });
    render();
  },
  async doc(b) {
    state.doc = b.dataset.doc;
    state.docHtml = await loadDoc(state.doc);
    $('#menu').close();
    state.tab = 'doc';
    render(true);
    scrollTo(0, 0);
  },
  mode(b) {
    state.mode = b.dataset.mode;
    store.set('mode', state.mode);
    applyTheme();
    render();
  },
  home() {
    if (state.tab === 'timer') return scrollTo(0, 0);
    state.tab = 'timer';
    render(true);
    scrollTo(0, 0);
  },
  settings() {
    $('#menu').close();
    state.tab = 'settings';
    render(true);
  },
  'accent-reset'() {
    state.accent = DEFAULT_ACCENT;
    store.set('accent', state.accent);
    applyTheme();
    render();
  },
  async logout() {
    if (await confirmDialog(t('confirmLogout'), t('logout'))) return logout();
  },
  async 'delete-account'() {
    if (!(await confirmDialog(t('confirmDelAccount'), t('del'), true))) return;
    toTimerScreen();
    busy.show(t('deleting'));
    let ok;
    try {
      ok = await guarded(() => api.deleteAccount());
    } finally {
      busy.hide();
    }
    if (ok) {
      toast(t('deleted'));
      await logout();
    }
  },
};

// ビューとメニューの両方で、data-act / data-form を委譲処理する
const closeDropdowns = () => {
  for (const l of document.querySelectorAll('.dd-list')) {
    l.classList.remove('open');
    l.previousElementSibling.setAttribute('aria-expanded', 'false');
  }
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.dd')) closeDropdowns();
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) actions[b.dataset.act]?.(b);
});

$('#menu-btn').innerHTML = icon('menu');
$('#menu-btn').addEventListener('click', () => {
  renderMenuBody();
  $('#menu').showModal();
});
// ダイアログの外(背景)をクリックしたときだけ閉じる。ダイアログ内の余白では閉じない。
function closeOnOutsideClick(dialog) {
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
}
closeOnOutsideClick($('#menu'));
closeOnOutsideClick($('#confirm'));
dark.addEventListener('change', applyTheme);
wide.addEventListener('change', () => render(true));

const NAV_ICONS = { timer: 'timer', calendar: 'calendar', bond: 'heart' };
for (const b of document.querySelectorAll('nav button')) b.innerHTML = icon(NAV_ICONS[b.dataset.tab], 24);

view.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (e.target.dataset.form !== 'bond') return;
  const f = new FormData(e.target);
  const bond = { char_key: f.get('char_key'), bond_level: Number(f.get('bond_level')), recorded_at: f.get('recorded_at') };
  const data = await guarded(() => api.addBond(bond));
  if (data) {
    state.relationship = [...state.relationship, data.item];
    state.bondLevel = null; // 次の RANK を初期値にする
    state.bondDate = bond.recorded_at;
    render();
  }
});

// カラーピッカーはドラッグ中に連続して発火するため、メニューは再描画せず色だけ反映する
document.addEventListener('input', (e) => {
  if (e.target.name === 'bond_level') {
    // RANK は 1〜BOND_MAX の整数のみ
    const n = e.target.value.replace(/\D/g, '');
    e.target.value = n === '' ? '' : String(Math.min(BOND_MAX, Math.max(1, Number(n))));
    return;
  }
  if (e.target.dataset.form !== 'accent') return;
  state.accent = e.target.value;
  store.set('accent', state.accent);
  applyTheme();
});

document.addEventListener('change', async (e) => {
  const kind = e.target.dataset.form;
  if (kind === 'bond-char') {
    state.bondChar = e.target.value;
    state.bondLevel = null;
    store.set('char', state.bondChar);
    render();
  }
  if (kind === 'tz') saveProfile({ timezone: e.target.value || null });
  if (kind === 'import' && e.target.files[0]) {
    const file = e.target.files[0];
    e.target.value = '';
    toTimerScreen();
    busy.show(t('importReading'), 0);
    try {
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        return toast(t('badJson'));
      }
      busy.show(t('importSending', { taps: parsed?.taps?.length ?? 0, bonds: parsed?.relationship?.length ?? 0 }), 1);
      const r = await guarded(() => api.importData(parsed));
      if (r) {
        busy.show(t('importRefresh'), 2);
        await loadAll();
        toast(t('imported', { taps: r.taps, bonds: r.relationship, skipped: r.skipped }));
      }
    } finally {
      busy.hide();
    }
  }
});

document.querySelector('nav').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  if (state.tab === b.dataset.tab) return;
  state.tab = b.dataset.tab;
  render(true);
});

$('#login-btn').addEventListener('click', () => guarded(login));
$('#reauth-btn').addEventListener('click', async () => {
  if (await guarded(login)) {
    $('#reauth').hidden = true;
    loadAll();
  }
});

applyStatic();
applyTheme();

setInterval(() => tick(view), 1000);

onUser((user) => {
  state.user = user;
  if (!user) return show('login');
  show('app');
  loadAll();
});

if ('serviceWorker' in navigator && !pushEnabled()) {
  // 通知を使わない場合も PWA としてインストール可能にするため登録する
  navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
}

// 入力欄以外ではコピー・選択・ドラッグを止める
const isField = (e) => e.target instanceof Element && e.target.closest('input, textarea');
for (const type of ['copy', 'cut', 'selectstart', 'dragstart']) {
  document.addEventListener(type, (e) => isField(e) || e.preventDefault());
}

// 横スクロールの一覧は、マウスホイールの縦回転でも動かせるようにする
document.addEventListener(
  'wheel',
  (e) => {
    const list = e.target instanceof Element && e.target.closest('.gifts');
    if (list && list.scrollWidth > list.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      list.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  },
  { passive: false },
);

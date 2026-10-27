// 起動・タブ切替・状態管理。
import { ReauthRequired, login, logout, onUser } from './auth.js';
import { api } from './api.js';
import { disablePush, enablePush, pushEnabled, pushSupported } from './push.js';
import { logicalMonth, nextMonth, prevMonth, uuidv7 } from './time.js';
import { renderBond, renderCalendar, renderSettings, renderTimer, tick } from './views.js';

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

const state = {
  user: null,
  tab: 'timer',
  profile: { ticket1_time: null, ticket2_time: null, timezone: null },
  lastTap: null,
  relationship: [],
  calMonth: logicalMonth(Date.now()),
  calTaps: [],
  calLoading: false,
  selectedDay: null,
  pushSupported: pushSupported(),
  pushOn: pushEnabled(),
};

function render() {
  state.calAtMin = state.calMonth <= CAL_MIN;
  state.calAtMax = state.calMonth >= logicalMonth(Date.now());
  const html = { timer: renderTimer, calendar: renderCalendar, bond: renderBond, settings: renderSettings }[state.tab](state);
  view.innerHTML = html;
  tick(view);
  for (const b of document.querySelectorAll('nav button')) b.setAttribute('aria-selected', b.dataset.tab === state.tab);
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
  render();
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
    const prev = state.lastTap;
    const temp = { id: uuidv7(), tap_time: new Date().toISOString() };
    state.lastTap = temp; // 楽観的更新
    render();
    const data = await guarded(() => api.tap());
    if (data) {
      state.lastTap = data.tap;
      if (state.calMonth === logicalMonth(Date.now())) state.calTaps = [...state.calTaps, data.tap];
      if (!data.scheduled && state.pushOn) toast('境界を跨ぐため通知は予約されません');
    } else {
      state.lastTap = prev;
    }
    render();
  },
  'ticket-use': (b) => saveProfile({ [`ticket${b.dataset.n}_time`]: new Date().toISOString() }),
  'ticket-clear': (b) => saveProfile({ [`ticket${b.dataset.n}_time`]: null }),
  'cal-prev': () => loadCalendar(prevMonth(state.calMonth)),
  'cal-next': () => loadCalendar(nextMonth(state.calMonth)),
  day(b) {
    state.selectedDay = b.dataset.day;
    render();
  },
  async 'bond-del'(b) {
    if (!confirm('この記録を削除しますか?')) return;
    if (await guarded(() => api.deleteBond(b.dataset.id))) {
      state.relationship = state.relationship.filter((x) => x.id !== b.dataset.id);
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
  async terms() {
    const dlg = $('#content');
    if (!dlg.dataset.loaded) {
      $('#content-body').innerHTML = await (await fetch('/content.html')).text();
      dlg.dataset.loaded = '1';
    }
    dlg.showModal();
  },
  logout: () => logout(),
  async 'delete-account'() {
    if (!confirm('Drive 上の全データと通知設定を削除します。元に戻せません。')) return;
    if (await guarded(() => api.deleteAccount())) {
      toast('削除しました');
      await logout();
    }
  },
};

view.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (b && !b.disabled) actions[b.dataset.act]?.(b);
});

view.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (e.target.dataset.form !== 'bond') return;
  const f = new FormData(e.target);
  const bond = { char_key: f.get('char_key'), bond_level: Number(f.get('bond_level')), recorded_at: f.get('recorded_at') };
  const data = await guarded(() => api.addBond(bond));
  if (data) {
    state.relationship = [...state.relationship, data.item].sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));
    render();
  }
});

view.addEventListener('change', async (e) => {
  const kind = e.target.dataset.form;
  if (kind === 'tz') saveProfile({ timezone: e.target.value || null });
  if (kind === 'import' && e.target.files[0]) {
    let parsed;
    try {
      parsed = JSON.parse(await e.target.files[0].text());
    } catch {
      return toast('JSON を読み込めません');
    }
    const r = await guarded(() => api.importData(parsed));
    if (r) {
      toast(`取り込み完了: タップ ${r.taps} / 絆 ${r.relationship} 件 (スキップ ${r.skipped})`);
      await loadAll();
    }
  }
});

document.querySelector('nav').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (!b) return;
  state.tab = b.dataset.tab;
  render();
});

$('#login-btn').addEventListener('click', () => guarded(login));
$('#reauth-btn').addEventListener('click', async () => {
  if (await guarded(login)) {
    $('#reauth').hidden = true;
    loadAll();
  }
});
$('#content-close').addEventListener('click', () => $('#content').close());

setInterval(() => state.tab === 'timer' && tick(view), 1000);

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

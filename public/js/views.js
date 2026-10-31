// タイマー / カレンダー / 絆 / メニュー の描画。状態は app.js が持ち、ここは HTML を組み立てるだけ。
import { t, categoryName, getLang, giftName, studentName, LANGS } from './i18n.js';
import { BOND_MAX, CHARACTERS, RATE_COLOR, SPRITE, charName, favoriteGifts } from '../data/gifts.js';
import {
  TICKET_COOLDOWN,
  daySlots,
  daysInMonth,
  fmt,
  fmtTime,
  logicalDay,
  nextBoundary,
  nextTapTime,
} from './time.js';

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ICONS = {
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  sun: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z',
  moon: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
  timer: 'M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0 0 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a8.994 8.994 0 0 0 7.03-14.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
  calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z',
  heart: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
  chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z',
  dropdown: 'M7 10l5 5 5-5z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z',
};
export const icon = (name, size = 20) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

// ---- タイマー ----

// 毎秒更新する要素は data-until(期限のエポックms)、有効化する要素は data-enable-at を持たせる
const countdown = (until) => `<span class="count" data-until="${until}"></span>`;

export function tick(root, now = Date.now()) {
  for (const el of root.querySelectorAll('[data-until]')) {
    const s = Math.max(0, Math.ceil((Number(el.dataset.until) - now) / 1000));
    const p = (n) => String(n).padStart(2, '0');
    el.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  }
  for (const b of root.querySelectorAll('[data-enable-at]')) b.disabled = Number(b.dataset.enableAt) > now;
}

export function renderTimer(state, now = Date.now()) {
  const tz = state.profile.timezone;
  const nextTap = state.lastTap ? nextTapTime(Date.parse(state.lastTap.tap_time)) : 0;

  // 枠の時刻は端末(または指定)のタイムゾーンで表示する
  const slots = daySlots(now, state.monthTaps)
    .map((s) =>
      s.tap
        ? `<li class="slot on">${fmtTime(s.tap, tz)}</li>`
        : `<li class="slot">${fmtTime(s.start, tz)}</li>`,
    )
    .join('');

  const tickets = [1, 2]
    .map((n) => {
      const t = state.profile[`ticket${n}_time`];
      const ready = t ? Date.parse(t) + TICKET_COOLDOWN : 0;
      return `<div>
        <p class="timer indent">${countdown(ready)}</p>
        <button class="primary wide" data-act="ticket-use" data-n="${n}" data-enable-at="${ready}">Ticket ${n}</button>
      </div>`;
    })
    .join('');

  return `
    <section class="block">
      <h2 class="label">Next Tap</h2>
      <p class="big indent">${countdown(nextTap)}</p>
      <ul class="slots">${slots}</ul>
      <button class="primary wide" data-act="tap" data-enable-at="${nextTap}">Tap</button>
    </section>
    <section class="block">
      <h2 class="label">Next Call</h2>
      <div class="grid2">${tickets}</div>
    </section>`;
}

// ---- カレンダー ----

// 1日のタップ数(最大8)をそのまま濃さの段階にする
export const heatLevel = (n) => Math.min(8, n);
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function dayCounts(taps) {
  const counts = {};
  for (const t of taps) {
    const d = logicalDay(Date.parse(t.tap_time));
    counts[d] = (counts[d] ?? 0) + 1;
  }
  return counts;
}

export function renderCalendar(state) {
  const { calMonth: month, calTaps: taps, selectedDay, calLoading } = state;
  const tz = state.profile.timezone;
  const [y, m] = month.split('-').map(Number);
  const counts = dayCounts(taps);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // 月曜始まり
  const cells = Array(lead).fill('<div></div>');
  for (let d = 1; d <= daysInMonth(month); d++) {
    const key = `${month}-${String(d).padStart(2, '0')}`;
    const n = counts[key] ?? 0;
    cells.push(
      `<button class="day${heatLevel(n) >= 5 ? ' hi' : ''}${key === selectedDay ? ' sel' : ''}" style="--lv:${heatLevel(n)}" data-act="day" data-day="${key}">
        <span>${d}</span>${n ? `<b>${n}</b>` : ''}</button>`,
    );
  }
  const dayTaps = selectedDay
    ? taps.filter((t) => logicalDay(Date.parse(t.tap_time)) === selectedDay).sort((a, b) => (a.tap_time < b.tap_time ? -1 : 1))
    : [];
  return `
    <section class="block">
      <div class="cal-head">
        <button class="ghost" data-act="cal-prev" ${state.calAtMin ? 'disabled' : ''}>Prev</button>
        <div>
          <h2 class="cal-title">${y}. ${m}</h2>
          <button class="ghost small" data-act="save-image">SAVE IMAGE</button>
        </div>
        <button class="ghost" data-act="cal-next" ${state.calAtMax ? 'disabled' : ''}>Next</button>
      </div>
      <div class="cal ${calLoading ? 'loading' : ''}">
        ${WEEKDAYS.map((w) => `<em>${w}</em>`).join('')}${cells.join('')}
      </div>
      <p class="sub note">${t('calNote')}</p>
    </section>
    ${
      selectedDay
        ? `<section class="block"><h2 class="label">${selectedDay} (${dayTaps.length})</h2>
           <ul class="plain">${
             dayTaps.map((t) => `<li>${fmtTime(Date.parse(t.tap_time), tz)} <span class="sub">(${fmtTime(Date.parse(t.tap_time), 'Asia/Tokyo')} JST)</span></li>`).join('') ||
             `<li class="sub">${t('noRecord')}</li>`
           }</ul></section>`
        : ''
    }`;
}

// ---- 独自ドロップダウン (ネイティブの select は使わない) ----

// options: [[value, label], ...]。選択は data-act="dd-pick" data-field data-value で通知する。
// ラベルは文字列、または [本文, 補足] (補足は小さい文字で2行目に出す)
const ddLabel = (l) => (Array.isArray(l) ? `<span class="l1">${esc(l[0])}</span><span class="l2">${esc(l[1])}</span>` : esc(l));

function dropdown({ field, value, options, large = false }) {
  const current = options.find(([v]) => v === value) ?? options[0];
  return `<div class="dd${large ? ' lg' : ''}">
    <button type="button" class="dd-btn" data-act="dd-toggle" aria-haspopup="listbox" aria-expanded="false">
      <span>${ddLabel(current[1])}</span>${icon('dropdown', large ? 28 : 18)}
    </button>
    <ul class="dd-list" role="listbox">
      ${options
        .map(([v, l]) => `<li><button type="button" role="option" aria-selected="${v === current[0]}" data-act="dd-pick" data-field="${field}" data-value="${esc(v)}">${ddLabel(l)}</button></li>`)
        .join('')}
    </ul>
  </div>`;
}

// ---- 絆 ----

export const bondRecords = (state, key) =>
  state.relationship.filter((b) => b.char_key === key).sort((a, b) => b.bond_level - a.bond_level);

export const defaultBondLevel = (state, key) =>
  Math.min(BOND_MAX, (bondRecords(state, key)[0]?.bond_level ?? 0) + 1);

// 生徒の選択肢。日本語は五十音順(データ順)、他言語は表示名の辞書順に並べる
function charOptions() {
  const list = CHARACTERS.map((c) => [c.key, studentName(c.name)]);
  const lang = getLang();
  return lang === 'ja' ? list : list.sort((a, b) => a[1].localeCompare(b[1], lang));
}

export function renderBond(state) {
  const key = state.bondChar;
  const char = CHARACTERS.find((c) => c.key === key);
  const level = state.bondLevel ?? defaultBondLevel(state, key);
  const date =
    state.bondDate ?? fmt(Date.now(), { year: 'numeric', month: '2-digit', day: '2-digit' }, state.profile.timezone).replace(/\//g, '-');
  const history = bondRecords(state, key).slice(0, 6);

  const gifts = favoriteGifts(char)
    .map((g) => {
      const x = (g.sprite % SPRITE.cols) * SPRITE.width;
      const y = Math.floor(g.sprite / SPRITE.cols) * SPRITE.height;
      return `<li class="gift" title="${esc(giftName(g.name))}">
        <i class="dot" style="background:${RATE_COLOR[g.mult]}"></i>
        <span class="gift-img" style="--x:${x};--y:${y}"></span>
        <span class="gift-cat">${esc(categoryName(g.category))}</span></li>`;
    })
    .join('');

  return `<div class="cols">
    <div>
    <form data-form="bond" class="block">
      <h2 class="label">Student</h2>
      ${dropdown({ field: 'char', value: key, large: true, options: charOptions() })}
      <div class="bond-row">
        <label>Rank <input name="bond_level" type="number" inputmode="numeric" min="1" max="${BOND_MAX}" value="${level}" required></label>
        <label>Date <input name="recorded_at" type="date" value="${esc(date)}" required></label>
        <button class="primary record">Record +</button>
      </div>
    </form>
    <section class="block">
      <h2 class="label">Favorite Gifts</h2>
      <div class="gifts-wrap">
        <ul class="gifts">${gifts || `<li class="sub">${t('noData')}</li>`}</ul>
        <button class="gifts-nav prev" data-act="gifts-scroll" data-dir="-1" aria-label="${t('prev')}">${icon('chevron')}</button>
        <button class="gifts-nav next" data-act="gifts-scroll" data-dir="1" aria-label="${t('next')}">${icon('chevron')}</button>
      </div>
    </section>
    <section class="block">
      <h2 class="label">History Log</h2>
      <ul class="history">${
        history
          .map(
            (b) => `<li><strong>${b.bond_level}</strong><span class="sep">|</span><span>${esc(b.recorded_at)}</span>
              <button class="ghost icon sm" data-act="bond-del" data-id="${esc(b.id)}" aria-label="${t('del')}">${icon('trash', 16)}</button></li>`,
          )
          .join('') || `<li class="sub">${t('noHistory')}</li>`
      }</ul>
    </section>
    </div>
    <div>
    <section class="block">
      <h2 class="label">Progress Graph</h2>
      <div class="chart"><canvas id="chart"></canvas></div>
    </section>
    </div>
  </div>`;
}

// ---- メニュー (右上ハンバーガー) ----

export const DOCS = ['about', 'guide', 'faq', 'terms', 'privacy', 'operator'];
export const MODES = ['auto', 'light', 'dark'];
export const DEFAULT_ACCENT = '#4355b9';

// タイムゾーンの現在のUTCオフセット(分)と "+09:00" 形式の表記
export function zoneOffset(zone, at = new Date()) {
  try {
    const part = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const m = part.match(/([+-])(\d{2}):(\d{2})/);
    if (!m) return { min: 0, text: '+00:00' };
    const min = (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
    return { min, text: `${m[1]}${m[2]}:${m[3]}` };
  } catch {
    return { min: 0, text: '+00:00' };
  }
}

// オフセットの小さい順 (同じなら名前順) に並べ、「(UTC+09:00) Asia/Tokyo」の形にする
export function zoneOptions(zones) {
  return zones
    .map((z) => ({ z, ...zoneOffset(z) }))
    .sort((a, b) => a.min - b.min || a.z.localeCompare(b.z))
    .map(({ z, text }) => [z, [z, `UTC${text}`]]);
}

export function renderMenu(state) {
  const u = state.user ?? {};
  const name = u.displayName || u.email || '';
  return `
    <div class="menu-head">
      <span class="avatar">${esc([...name][0] ?? '')}${
        u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''
      }</span>
      <span class="who"><strong>${esc(name)}</strong>${u.displayName ? `<small>${esc(u.email ?? '')}</small>` : ''}</span>
    </div>
    <div class="menu-list">
      ${DOCS.map((id) => `<button class="menu-item" data-act="doc" data-doc="${id}">${icon('chevron')}${esc(t('doc' + id[0].toUpperCase() + id.slice(1)))}</button>`).join('')}
    </div>
    <hr>
    <div class="menu-list">
      <button class="menu-item" data-act="settings">${icon('settings')}${t('settings')}</button>
    </div>`;
}

// ---- ドキュメントページ (About など) ----

export const renderDoc = (state) => `<section class="block doc">${state.docHtml ?? ''}</section>`;

// ---- 設定ページ ----

export function renderSettings(state) {
  const zones = Intl.supportedValuesOf?.('timeZone') ?? [];
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tz = state.profile.timezone;
  return `
    <section class="block settings">
      <h2 class="label">${t('settings')}</h2>
      <h3 class="menu-title">${t('display')}</h3>
      <div class="seg">
        ${MODES.map((id) => `<button data-act="mode" data-mode="${id}" aria-pressed="${state.mode === id}">${t('mode' + id[0].toUpperCase() + id.slice(1))}</button>`).join('')}
      </div>
      <label class="accent">${t('accent')}
        <span class="row">
          <input type="color" data-form="accent" value="${esc(state.accent)}">
          <button class="ghost" data-act="accent-reset">${t('reset')}</button>
        </span>
      </label>
      <div class="field">${t('timezone')}
        ${dropdown({
          field: 'tz',
          value: tz ?? '',
          options: [['', [t('deviceZone'), `${deviceZone} · UTC${zoneOffset(deviceZone).text}`]], ...zoneOptions(zones)],
        })}
      </div>
      <div class="field">${t('language')}
        ${dropdown({ field: 'lang', value: getLang(), options: LANGS })}
      </div>
      <hr>
      <h3 class="menu-title">${t('notifData')}</h3>
      <div class="menu-list">
        <button class="menu-item" data-act="push" ${state.pushSupported ? '' : 'disabled'}>${icon('bell')}${t(state.pushOn ? 'pushOn' : 'pushOff')}</button>
        ${state.pushSupported ? '' : `<p class="sub hint">${t('pushUnsupported')}</p>`}
        <label class="menu-item">${icon('upload')}${t('importOld')}<input type="file" accept="application/json" data-form="import" hidden></label>
        <button class="menu-item danger" data-act="delete-account">${icon('trash')}${t('deleteData')}</button>
        <button class="menu-item" data-act="logout">${icon('logout')}${t('logout')}</button>
      </div>
    </section>`;
}

export { charName };

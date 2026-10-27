// タイマー / カレンダー / 絆 / 設定 の描画。状態は app.js が持ち、ここは HTML を組み立てるだけ。
import { BOND_MAX, CHARACTERS, charName } from '../data/gifts.js';
import {
  TAP_INTERVAL,
  TICKET_COOLDOWN,
  daysInMonth,
  fmt,
  fmtDateTime,
  fmtDuration,
  fmtJst,
  fmtTime,
  logicalDay,
  nextBoundary,
} from './time.js';

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const tzLabel = (tz) => tz || Intl.DateTimeFormat().resolvedOptions().timeZone;

// ---- タイマー ----

// 毎秒更新する要素は data-until(期限のエポックms)を持たせ、tick() で書き換える
const countdown = (until, doneText) =>
  `<span class="count" data-until="${until}" data-done="${esc(doneText)}"></span>`;

export function tick(root, now = Date.now()) {
  for (const el of root.querySelectorAll('[data-until]')) {
    const left = Number(el.dataset.until) - now;
    el.textContent = left > 0 ? fmtDuration(left) : el.dataset.done;
    el.classList.toggle('ready', left <= 0);
  }
}

export function renderTimer(state, now = Date.now()) {
  const tz = state.profile.timezone;
  const last = state.lastTap ? Date.parse(state.lastTap.tap_time) : null;

  const tickets = [1, 2]
    .map((n) => {
      const t = state.profile[`ticket${n}_time`];
      const ready = t ? Date.parse(t) + TICKET_COOLDOWN : 0;
      return `<div class="card ticket">
        <h3>チケット${n}</h3>
        <p>${ready > now ? countdown(ready, '使用可能') : '<span class="count ready">使用可能</span>'}</p>
        <p class="sub">${t ? `使用: ${fmtDateTime(Date.parse(t), tz)}` : '未使用'}</p>
        <div class="row">
          <button data-act="ticket-use" data-n="${n}">使用した</button>
          <button class="ghost" data-act="ticket-clear" data-n="${n}">リセット</button>
        </div>
      </div>`;
    })
    .join('');

  let b = now;
  const slots = [0, 1, 2]
    .map(() => {
      b = nextBoundary(b);
      return `<li><strong>${fmtDateTime(b, tz)}</strong> <span class="sub">(${fmtJst(b)} JST)</span></li>`;
    })
    .join('');

  return `
    <section class="card main">
      <h2>次のタップまで</h2>
      <p class="big">${last ? countdown(last + TAP_INTERVAL, 'タップ可能') : '<span class="count ready">タップ可能</span>'}</p>
      <p class="sub">${last ? `前回: ${fmtDateTime(last, tz)}` : 'まだ記録がありません'}</p>
      <button class="primary" data-act="tap">タップ記録</button>
    </section>
    <div class="grid2">${tickets}</div>
    <section class="card">
      <h3>次のリセット (4:00 / 16:00 JST)</h3>
      <ul class="plain">${slots}</ul>
      <p class="sub">表示タイムゾーン: ${esc(tzLabel(tz))}</p>
    </section>`;
}

// ---- カレンダー ----

export function renderCalendar(state) {
  const { calMonth: month, calTaps: taps, selectedDay, calLoading } = state;
  const tz = state.profile.timezone;
  const [y, m] = month.split('-').map(Number);
  const counts = {};
  for (const t of taps) {
    const d = logicalDay(Date.parse(t.tap_time));
    counts[d] = (counts[d] ?? 0) + 1;
  }
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells = Array(lead).fill('<div></div>');
  for (let d = 1; d <= daysInMonth(month); d++) {
    const key = `${month}-${String(d).padStart(2, '0')}`;
    const n = counts[key];
    cells.push(
      `<button class="day${key === selectedDay ? ' sel' : ''}" data-act="day" data-day="${key}">${d}${
        n ? `<small>${n}</small>` : ''
      }</button>`,
    );
  }
  const dayTaps = selectedDay
    ? taps.filter((t) => logicalDay(Date.parse(t.tap_time)) === selectedDay).sort((a, b) => (a.tap_time < b.tap_time ? -1 : 1))
    : [];
  return `
    <section class="card">
      <div class="row between">
        <button class="ghost" data-act="cal-prev" ${state.calAtMin ? 'disabled' : ''}>‹</button>
        <h2>${y}年${m}月</h2>
        <button class="ghost" data-act="cal-next" ${state.calAtMax ? 'disabled' : ''}>›</button>
      </div>
      <p class="sub">日付はゲーム日(4:00 JST 区切り)です。</p>
      <div class="cal ${calLoading ? 'loading' : ''}">
        ${['日', '月', '火', '水', '木', '金', '土'].map((w) => `<b>${w}</b>`).join('')}${cells.join('')}
      </div>
    </section>
    ${
      selectedDay
        ? `<section class="card"><h3>${selectedDay} のタップ (${dayTaps.length})</h3>
           <ul class="plain">${dayTaps
             .map((t) => `<li>${fmtTime(Date.parse(t.tap_time), tz)} <span class="sub">(${fmtJst(Date.parse(t.tap_time))} JST)</span></li>`)
             .join('') || '<li class="sub">記録なし</li>'}</ul></section>`
        : ''
    }`;
}

// ---- 絆 ----

export function renderBond(state) {
  const today = fmt(Date.now(), { year: 'numeric', month: '2-digit', day: '2-digit' }, state.profile.timezone)
    .replace(/\//g, '-');
  return `
    <section class="card">
      <h2>絆ランクを記録</h2>
      <form data-form="bond" class="form">
        <label>生徒
          <select name="char_key">${CHARACTERS.map((c) => `<option value="${esc(c.key)}">${esc(c.name)}</option>`).join('')}</select>
        </label>
        <label>RANK <input name="bond_level" type="number" min="1" max="${BOND_MAX}" required></label>
        <label>日付 <input name="recorded_at" type="date" value="${today}" required></label>
        <button class="primary">登録</button>
      </form>
    </section>
    <section class="card">
      <h3>履歴</h3>
      <ul class="plain">${
        state.relationship
          .map(
            (b) => `<li class="row between">
              <span>${esc(b.recorded_at)} ${esc(charName(b.char_key))} <strong>RANK ${b.bond_level}</strong></span>
              <button class="ghost" data-act="bond-del" data-id="${esc(b.id)}">削除</button></li>`,
          )
          .join('') || '<li class="sub">まだ記録がありません</li>'
      }</ul>
    </section>`;
}

// ---- 設定 ----

export function renderSettings(state) {
  const zones = Intl.supportedValuesOf?.('timeZone') ?? [];
  const tz = state.profile.timezone;
  return `
    <section class="card">
      <h2>設定</h2>
      <p class="sub">${esc(state.user.email ?? '')} でログイン中</p>
      <label class="form">タイムゾーン
        <select data-form="tz">
          <option value="">端末の設定 (${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)})</option>
          ${zones.map((z) => `<option value="${esc(z)}" ${z === tz ? 'selected' : ''}>${esc(z)}</option>`).join('')}
        </select>
      </label>
      <div class="row">
        <button data-act="push" ${state.pushSupported ? '' : 'disabled'}>${state.pushOn ? '通知をオフにする' : '通知をオンにする'}</button>
        ${state.pushSupported ? '' : '<span class="sub">この端末は通知に非対応です (iOS はホーム画面に追加が必要)</span>'}
      </div>
    </section>
    <section class="card">
      <h3>旧データの取り込み</h3>
      <p class="sub">旧アプリで書き出した JSON を選択してください。</p>
      <input type="file" accept="application/json" data-form="import">
    </section>
    <section class="card">
      <h3>アカウント</h3>
      <div class="row">
        <button data-act="terms">規約・FAQ</button>
        <button data-act="logout">ログアウト</button>
        <button class="danger" data-act="delete-account">全データを削除</button>
      </div>
    </section>`;
}

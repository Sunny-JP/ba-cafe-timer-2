import { api } from '../api.js';
import { $, esc, initAdminPage, toast } from './common.js';

const fmt = (n) => (n === undefined || n === null ? '-' : Number(n).toLocaleString());
const pct = (n, max) => (max ? Math.max(0, (n / max) * 100) : 0);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

// 縦棒。最大の棒だけ濃く、他は薄く。labels は軸ラベル(空文字は非表示)
function vbars(el, axis, values, titles, labels) {
  const max = Math.max(1, ...values);
  const peak = values.indexOf(Math.max(...values));
  el.innerHTML = values
    .map((v, i) => `<div class="col${v > 0 && i === peak ? ' peak' : ''}" data-tip="${esc(titles[i])}: ${fmt(v)}"><div class="bar" style="height:${pct(v, max)}%"></div></div>`)
    .join('');
  axis.innerHTML = labels.map((l) => `<span>${l}</span>`).join('');
}

function hbars(el, rows) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  el.innerHTML = rows
    .map((r) => `<div class="r" data-tip="${esc(r.label)}: ${fmt(r.value)}"><span>${esc(r.label)}</span><div class="track"><div class="fill" style="width:${pct(r.value, max)}%"></div></div></div>`)
    .join('');
}

function kpis(s) {
  const last30 = sum(s.daily.map((d) => d.count));
  const days = Math.max(1, s.daily.length);
  const pushRate = s.users ? Math.round((s.pushUsers / s.users) * 100) : null;
  const perUser = s.users ? s.totalTaps / s.users : null;
  const cards = [
    ['登録ユーザー数', fmt(s.users), ''],
    ['通知オン', fmt(s.pushUsers), pushRate === null ? '' : `ユーザーの ${pushRate}%`],
    ['累計タップ数', fmt(s.totalTaps), perUser === null ? '' : `1人あたり ${perUser.toFixed(1)} 回`],
    ['直近30日のタップ', fmt(last30), `1日平均 ${(last30 / days).toFixed(1)} 回`],
  ];
  $('#cards').innerHTML = cards.map(([l, v, sub]) => `<div class="kpi"><span>${l}</span><b>${v}</b><small>${sub || '&nbsp;'}</small></div>`).join('');
}

function charts(s) {
  // 時間帯 (JST 0〜23時)
  const hours = s.hourly;
  const peakH = hours.indexOf(Math.max(...hours));
  vbars($('#hourly'), $('#hourly-axis'), hours, hours.map((_, h) => `${h}時台`), hours.map((_, h) => (h % 3 === 0 ? h : '')));
  $('#hourly-sub').textContent = sum(hours) ? `最も多いのは ${peakH}時台` : 'まだデータがありません (集計開始後のタップが対象です)';

  // 曜日
  vbars($('#weekly'), $('#weekly-axis'), s.weekly, WEEK.map((w) => `${w}曜`), WEEK);
  const peakW = s.weekly.indexOf(Math.max(...s.weekly));
  $('#weekly-sub').textContent = sum(s.weekly) ? `最も多いのは ${WEEK[peakW]}曜日` : 'まだデータがありません';
}

// 100,90,80… の到達人数のヒートマップ付きランキング (並びはサーバー側で済み)
function ranking(s) {
  const ths = s.thresholds;
  // 各枠は下限で持つ。100 / 99～95 / 94～90 / 89～80 …
  const range = (i) => (i === 0 ? `${ths[0]}` : `${ths[i - 1] - 1}～${ths[i]}`);
  const max = Math.max(1, ...s.bonds.flatMap((b) => ths.map((t) => b.reached[t])));
  const head = `<div class="hd"><span></span><span style="text-align:left">キャラ</span><span>登録</span>${ths.map((_, i) => `<span>${range(i)}</span>`).join('')}</div>`;
  const rows = s.bonds.map(
    (b, i) =>
      `<div class="rw"><span class="no">${i + 1}</span><span class="nm" title="${esc(b.name)}">${esc(b.name)}</span><span class="reg">${fmt(b.records)}</span>${ths
        .map((t, i) => `<span class="c${b.reached[t] ? '' : ' z'}" style="--k:${(b.reached[t] / max).toFixed(3)}" title="${esc(b.name)} ${range(i)}: ${fmt(b.reached[t])}人">${fmt(b.reached[t])}</span>`)
        .join('')}</div>`,
  );
  $('#bonds').innerHTML = rows.length ? head + rows.join('') : '<p class="note">まだ記録がありません。</p>';
}

// 即時に出るツールチップ(data-tip を持つ要素にホバー/タップしたとき)
const tip = document.createElement('div');
tip.className = 'tip';
tip.hidden = true;
document.body.append(tip);
const place = (e) => {
  tip.style.left = `${Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8)}px`;
  tip.style.top = `${e.clientY - tip.offsetHeight - 12 < 0 ? e.clientY + 16 : e.clientY - tip.offsetHeight - 12}px`;
};
document.addEventListener('pointermove', (e) => {
  const el = e.target.closest?.('[data-tip]');
  tip.hidden = !el;
  if (!el) return;
  tip.textContent = el.dataset.tip;
  place(e);
});
document.addEventListener('pointerleave', () => (tip.hidden = true));

async function loadStats() {
  const s = await api.adminStats();
  kpis(s);
  charts(s);
  ranking(s);
}

initAdminPage('/admin/stats', () => loadStats().catch((e) => toast(e.message)));

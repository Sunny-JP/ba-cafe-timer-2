import { api } from '../api.js';
import { $, esc, initAdminPage, toast } from './common.js';

const num = (n) => (n === null ? '&lt;5' : n === undefined ? '-' : Number(n).toLocaleString());

function table(el, head, rows) {
  el.innerHTML = `<thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
}

async function loadStats() {
  const s = await api.adminStats();
  $('#kanon').textContent = s.kAnon;
  $('#cards').innerHTML = [
    ['登録ユーザー数', s.users],
    ['通知オンのユーザー数', s.pushUsers],
    ['直近30日のタップ数', s.daily.reduce((a, d) => a + d.count, 0)],
  ]
    .map(([l, n]) => `<div class="card"><b>${n === null ? '-' : Number(n).toLocaleString()}</b><span>${l}</span></div>`)
    .join('');
  const day = (k) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6)}`;
  table($('#daily'), ['日付', 'タップ数'], s.daily.map((d) => [day(d.key), num(d.count)]));
  table($('#monthly'), ['月', 'タップ数'], s.monthly.map((d) => [`${d.key.slice(0, 4)}-${d.key.slice(4)}`, num(d.count)]));
  table(
    $('#bonds'),
    ['キャラ', '記録数', ...s.thresholds.map((t) => `${t}以上`)],
    s.bonds.map((b) => [esc(b.name), num(b.records), ...s.thresholds.map((t) => num(b.reached[t]))]),
  );
}

initAdminPage('/admin/stats', () => loadStats().catch((e) => toast(e.message)));

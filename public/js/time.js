// JST 計算・表示・UUID v7。ブラウザと Worker で共用するため DOM に依存しない。

const HOUR = 3600 * 1000;
export const JST_OFFSET = 9 * HOUR;
export const TAP_INTERVAL = 3 * HOUR;
export const TICKET_COOLDOWN = 20 * HOUR;
export const DUPLICATE_WINDOW = 60 * 1000;

const pad = (n, w = 2) => String(n).padStart(w, '0');

// ゲーム日・論理月は「JST 4:00 区切り」。JST に直してから 4 時間戻した UTC フィールドを読む。
const logicalDate = (ms) => new Date(ms + JST_OFFSET - 4 * HOUR);

export function logicalDay(ms) {
  const d = logicalDate(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function logicalMonth(ms) {
  return logicalDay(ms).slice(0, 7);
}

export function prevMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
}

export function nextMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
}

export function daysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// 論理月の開始(毎月1日 4:00 JST)と終了(翌月1日 4:00 JST)
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return [Date.UTC(y, m - 1, 1, 4) - JST_OFFSET, Date.UTC(y, m, 1, 4) - JST_OFFSET];
}

export const isMonth = (s) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

// 次の 4:00 / 16:00 JST(ちょうどの時刻は「次」とみなす)
export function nextBoundary(ms) {
  const half = 12 * HOUR;
  const s = ms + JST_OFFSET - 4 * HOUR;
  return (Math.floor(s / half) + 1) * half + 4 * HOUR - JST_OFFSET;
}

// タップから3時間後に通知を予約するか。4:00/16:00 を跨ぐ場合は予約しない。
export function shouldScheduleNotification(tapMs) {
  const sendAt = Math.floor((tapMs + TAP_INTERVAL) / 1000) * 1000;
  return nextBoundary(tapMs) > sendAt ? sendAt : null;
}

// 表示用。tz を渡さなければ端末のタイムゾーン。
export function fmt(ms, opts, tz) {
  return new Intl.DateTimeFormat('ja-JP', { timeZone: tz || undefined, ...opts }).format(ms);
}
export const fmtTime = (ms, tz) => fmt(ms, { hour: '2-digit', minute: '2-digit', hour12: false }, tz);
export const fmtDateTime = (ms, tz) =>
  fmt(ms, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }, tz);
export const fmtJst = (ms) => fmtTime(ms, 'Asia/Tokyo');

export function fmtDuration(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function uuidv7(now = Date.now()) {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let t = now;
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => pad(x.toString(16))).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

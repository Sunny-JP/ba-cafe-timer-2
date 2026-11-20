// ゲーム内の日付 (JST 4:00 区切り) の計算・表示・UUID v7。ブラウザと Worker で共用する
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const JST_OFFSET = 9 * HOUR;
const DAY_START = 4 * HOUR;
export const TAP_INTERVAL = 3 * HOUR;
export const TICKET_COOLDOWN = 20 * HOUR;

const padTwo = (number) => String(number).padStart(2, '0');
const splitMonth = (month) => month.split('-').map(Number);

// JST に直して 4 時間戻した時刻の UTC 日付が、ゲーム内の日付になる
export function logicalDay(time) {
  const shifted = new Date(time + JST_OFFSET - DAY_START);
  return `${shifted.getUTCFullYear()}-${padTwo(shifted.getUTCMonth() + 1)}-${padTwo(shifted.getUTCDate())}`;
}

export const logicalMonth = (time) => logicalDay(time).slice(0, 7);

export function prevMonth(month) {
  const [year, monthNumber] = splitMonth(month);
  return monthNumber === 1 ? `${year - 1}-12` : `${year}-${padTwo(monthNumber - 1)}`;
}

export function nextMonth(month) {
  const [year, monthNumber] = splitMonth(month);
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${padTwo(monthNumber + 1)}`;
}

export function daysInMonth(month) {
  const [year, monthNumber] = splitMonth(month);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

// 論理月の開始 (1 日 4:00 JST) と終了 (翌月 1 日 4:00 JST)
export function monthRange(month) {
  const [year, monthNumber] = splitMonth(month);
  return [Date.UTC(year, monthNumber - 1, 1, 4) - JST_OFFSET, Date.UTC(year, monthNumber, 1, 4) - JST_OFFSET];
}

export const isMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

// 次の 4:00 / 16:00 JST (ちょうどの時刻は「次」とみなす)
export function nextBoundary(time) {
  const halfDay = 12 * HOUR;
  const shifted = time + JST_OFFSET - DAY_START;
  return (Math.floor(shifted / halfDay) + 1) * halfDay + DAY_START - JST_OFFSET;
}

// 次にタップできる時刻: 3 時間後と次の 4:00 / 16:00 の早い方
export const nextTapTime = (lastTapTime) => Math.min(lastTapTime + TAP_INTERVAL, nextBoundary(lastTapTime));

// 3 時間後に通知するなら送信時刻、4:00 / 16:00 を跨ぐなら null
export function shouldScheduleNotification(tapTime) {
  const sendAt = Math.floor((tapTime + TAP_INTERVAL) / 1000) * 1000;
  return nextBoundary(tapTime) > sendAt ? sendAt : null;
}

// 表示用。timeZone を渡さなければ端末のタイムゾーン
export const fmt = (time, options, timeZone) => new Intl.DateTimeFormat('ja-JP', { timeZone: timeZone || undefined, ...options }).format(time);
export const fmtTime = (time, timeZone) => fmt(time, { hour: '2-digit', minute: '2-digit', hour12: false }, timeZone);

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function uuidv7(now = Date.now()) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let remaining = now;
  for (let index = 5; index >= 0; index--) {
    bytes[index] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => padTwo(byte.toString(16))).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// 当日を 3 時間ごとの 8 枠に分け、各枠の最初のタップを割り当てる。
// 最新のタップより後の空き枠は「最新タップ + 3 時間ごと」の時刻で表示する (次の 4:00 / 16:00 以降は元の時刻)
export function daySlots(now, taps) {
  const dayStart = Math.floor((now + JST_OFFSET - DAY_START) / DAY) * DAY + DAY_START - JST_OFFSET;
  const tapTimes = taps.map((tap) => Date.parse(tap.tap_time)).sort((first, second) => first - second);
  const todayTimes = tapTimes.filter((time) => time >= dayStart && time < dayStart + DAY);
  const lastTime = todayTimes.length ? todayTimes[todayTimes.length - 1] : null;
  const lastSlot = lastTime === null ? -1 : Math.floor((lastTime - dayStart) / TAP_INTERVAL);
  const boundary = lastTime === null ? 0 : nextBoundary(lastTime);
  return Array.from({ length: 8 }, (_, slotIndex) => {
    const start = dayStart + slotIndex * TAP_INTERVAL;
    const shifted = lastTime === null || slotIndex <= lastSlot ? null : lastTime + (slotIndex - lastSlot) * TAP_INTERVAL;
    const time = shifted !== null && shifted < boundary ? shifted : start;
    return { start, time, tap: tapTimes.find((tapTime) => tapTime >= start && tapTime < start + TAP_INTERVAL) ?? null };
  });
}

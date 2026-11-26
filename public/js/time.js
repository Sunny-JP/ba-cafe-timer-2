const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const JST_OFFSET = 9 * HOUR;
const DAY_START = 4 * HOUR;
const TAP_INTERVAL = 3 * HOUR;
export const TICKET_COOLDOWN = 20 * HOUR;

export const padTwo = (number) => String(number).padStart(2, '0');
export const byTapTime = (first, second) => (first.tap_time < second.tap_time ? -1 : first.tap_time > second.tap_time ? 1 : 0);
export const latestTap = (taps, initial = null) => taps.reduce((latest, tap) => (!latest || tap.tap_time > latest.tap_time ? tap : latest), initial);
const splitMonth = (month) => month.split('-').map(Number);

// ゲーム内の日付は 4:00 JST 区切り
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

export function leadingBlanks(month) {
  const [year, monthNumber] = splitMonth(month);
  return (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
}

export function monthRange(month) {
  const [year, monthNumber] = splitMonth(month);
  return [Date.UTC(year, monthNumber - 1, 1, 4) - JST_OFFSET, Date.UTC(year, monthNumber, 1, 4) - JST_OFFSET];
}

export const isMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export function nextBoundary(time) {
  const halfDay = 12 * HOUR;
  const shifted = time + JST_OFFSET - DAY_START;
  return (Math.floor(shifted / halfDay) + 1) * halfDay + DAY_START - JST_OFFSET;
}

export const nextTapTime = (lastTapTime) => Math.min(lastTapTime + TAP_INTERVAL, nextBoundary(lastTapTime));

export function shouldScheduleNotification(tapTime) {
  const sendAt = Math.floor((tapTime + TAP_INTERVAL) / 1000) * 1000;
  return nextBoundary(tapTime) > sendAt ? sendAt : null;
}

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

// 最新タップより後の空き枠は、次の 4:00 / 16:00 までは最新タップから 3 時間ごと
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

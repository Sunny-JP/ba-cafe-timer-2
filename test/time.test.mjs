import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  logicalDay,
  logicalMonth,
  nextBoundary,
  prevMonth,
  monthRange,
  shouldScheduleNotification,
  nextTapTime,
  daySlots,
  uuidv7,
} from '../public/js/time.js';

const jst = (s) => Date.parse(`${s}+09:00`);

test('論理月: 毎月1日 4:00 JST 前は前月', () => {
  assert.equal(logicalMonth(jst('2026-03-01T03:59:59')), '2026-02');
  assert.equal(logicalMonth(jst('2026-03-01T04:00:00')), '2026-03');
  assert.equal(logicalMonth(jst('2027-01-01T03:59:59')), '2026-12');
});

test('論理日: 4:00 JST 区切り', () => {
  assert.equal(logicalDay(jst('2026-05-10T03:59:59')), '2026-05-09');
  assert.equal(logicalDay(jst('2026-05-10T04:00:00')), '2026-05-10');
});

test('次の境界 (4:00 / 16:00 JST)', () => {
  assert.equal(nextBoundary(jst('2026-05-10T03:00:00')), jst('2026-05-10T04:00:00'));
  assert.equal(nextBoundary(jst('2026-05-10T04:00:00')), jst('2026-05-10T16:00:00'));
  assert.equal(nextBoundary(jst('2026-05-10T16:00:00')), jst('2026-05-11T04:00:00'));
});

test('通知予約: 3時間後が境界を跨ぐ場合は予約しない', () => {
  const t = jst('2026-05-10T10:00:00.789');
  assert.equal(shouldScheduleNotification(t), jst('2026-05-10T13:00:00'));
  assert.equal(shouldScheduleNotification(jst('2026-05-10T13:00:01')), null);
  assert.equal(shouldScheduleNotification(jst('2026-05-10T13:00:00')), null); // ちょうど 16:00 も境界扱い
});

test('月の範囲と前月', () => {
  assert.equal(prevMonth('2026-01'), '2025-12');
  const [s, e] = monthRange('2026-02');
  assert.equal(s, jst('2026-02-01T04:00:00'));
  assert.equal(e, jst('2026-03-01T04:00:00'));
});

test('UUID v7: 形式と時刻順', () => {
  const a = uuidv7(1_700_000_000_000);
  const b = uuidv7(1_700_000_001_000);
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.ok(a < b);
});

test('次のタップ時刻: 3時間後か境界の早い方', () => {
  assert.equal(nextTapTime(jst('2026-05-10T10:00:00')), jst('2026-05-10T13:00:00'));
  assert.equal(nextTapTime(jst('2026-05-10T15:00:00')), jst('2026-05-10T16:00:00'));
});

test('日の枠: 4:00 JST 始まりの3時間8枠', () => {
  const taps = [{ tap_time: '2026-05-10T08:39:00+09:00' }, { tap_time: '2026-05-10T08:50:00+09:00' }, { tap_time: '2026-05-10T20:31:00+09:00' }];
  const slots = daySlots(jst('2026-05-10T21:00:00'), taps);
  assert.equal(slots[0].start, jst('2026-05-10T04:00:00'));
  assert.equal(slots[7].start, jst('2026-05-11T01:00:00'));
  assert.equal(slots[0].tap, null);
  assert.equal(slots[1].tap, jst('2026-05-10T08:39:00'));
  assert.equal(slots[5].tap, jst('2026-05-10T20:31:00'));
});

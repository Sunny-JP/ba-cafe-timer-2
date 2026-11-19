// タップの記録と、処理中ボタンの制御。
import { t } from "./i18n.js";
import { log } from "./log.js";
import { logicalMonth, nextTapTime, shouldScheduleNotification, uuidv7 } from "./time.js";
import { state } from "./state.js";
import { saveBootCache } from "./cache.js";
import { flush, queueTap } from "./outbox.js";
import { render } from "../screens/render.js";
import { toast } from "../screens/ui.js";

// ボタンを処理中表示(回転アイコン・無効)にして fn を実行する。処理中の連打は無視する
export async function withPending(key, fn) {
  if (state.pending.has(key)) {
    log.warn("pending", `ignored (already pending): ${key}`);
    return;
  }
  log.info("pending", `start: ${key}`);
  state.pending.add(key);
  render();
  try {
    await fn();
    log.info("pending", `done: ${key}`);
  } catch (e) {
    log.error("pending", `exception: ${key}`, e);
    throw e;
  } finally {
    state.pending.delete(key);
    render();
  }
}

// タップを記録する。押した時点で ID と時刻を決めて端末に保存し、画面に反映して完了とする。
// サーバーへは outbox.js が裏で送る (届くまで送り直す)
export function recordTap() {
  const now = Date.now();
  if (state.lastTap && now < nextTapTime(Date.parse(state.lastTap.tap_time))) {
    log.warn("tap", "recordTap: ignored (cooldown)");
    return;
  }
  const tap = { id: uuidv7(now), tap_time: new Date(now).toISOString() };
  queueTap(tap); // 先に端末へ保存する (このあとアプリを閉じられても失わない)
  log.info("tap", "recordTap: saved to device", tap);
  state.lastTap = tap;
  state.monthTaps = [...state.monthTaps, tap];
  if (state.calMonth === logicalMonth(now)) state.calTaps = state.monthTaps;
  saveBootCache();
  render();
  // 通知を予約するかは押した時刻だけで決まるので、通信を待たずに知らせる
  if (state.pushOn && !shouldScheduleNotification(now)) toast(t("noPushSchedule"));
  flush();
}

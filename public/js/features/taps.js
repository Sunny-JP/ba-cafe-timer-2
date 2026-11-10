// タップの記録 (楽観的更新・再認証待ちの保留・処理中ボタンの制御)。
import { ReauthRequired } from "./auth.js";
import { ApiError, api } from "./api.js";
import { t } from "./i18n.js";
import { log } from "./log.js";
import { logicalMonth, uuidv7 } from "./time.js";
import { state, store } from "./state.js";
import { saveBootCache } from "./cache.js";
import { showReauth } from "./guard.js";
import { render } from "../screens/render.js";
import { toast } from "../screens/ui.js";

// 再認証待ちで送れなかったタップ(押した時刻つき)。連携し直したあとに送る
const loadPendingTaps = () => {
  try {
    const list = JSON.parse(store.get("pendingTaps", "[]"));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const savePendingTaps = (list) => store.set("pendingTaps", JSON.stringify(list));

export async function flushPendingTaps() {
  let list = loadPendingTaps();
  log.info("tap", `flushPendingTaps: ${list.length} pending`);
  while (list.length) {
    try {
      await api.tap(list[0]);
      log.info("tap", "flushPendingTaps: sent", list[0]);
    } catch (e) {
      log.warn("tap", "flushPendingTaps: failed", e);
      // 通信・認証の問題なら残して次回へ。内容が不正(期限切れなど)なものは諦めて捨てる
      if (e instanceof ReauthRequired || !(e instanceof ApiError) || e.status >= 500 || e.status === 429) break;
    }
    list = list.slice(1);
    savePendingTaps(list);
  }
}

// ボタンを処理中表示(Loading…・無効)にして fn を実行する。処理中の連打は無視する
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

// タップを記録する。記録できた(または端末に保存した)ら true
export async function recordTap() {
  const prev = { lastTap: state.lastTap, monthTaps: state.monthTaps, calTaps: state.calTaps };
  const temp = { id: uuidv7(), tap_time: new Date().toISOString() };
  const onCurrent = state.calMonth === logicalMonth(Date.now());
  log.info("tap", `recordTap: start calMonth=${state.calMonth} onCurrent=${onCurrent} temp ->`, temp.tap_time);
  state.lastTap = temp; // 楽観的更新
  state.monthTaps = [...state.monthTaps, temp];
  if (onCurrent) state.calTaps = state.monthTaps;
  render();
  let data;
  try {
    data = await api.tap();
  } catch (e) {
    log.error("tap", "recordTap: request failed", e);
    if (e instanceof ReauthRequired) {
      // 再認証が必要でもタップは失わない: 端末に保存し、連携し直したあとに送る
      log.warn("tap", "recordTap: reauth required, saving tap to device");
      savePendingTaps([...loadPendingTaps(), temp]);
      showReauth();
      toast(t("tapQueued"));
      render();
      return true;
    }
    toast(e.message);
  }
  if (data) {
    log.info("tap", "recordTap: saved on server, tap ->", data.tap);
    state.lastTap = data.tap;
    state.monthTaps = state.monthTaps.map((x) => (x === temp ? data.tap : x));
    if (onCurrent) state.calTaps = state.monthTaps;
    saveBootCache();
    log.info("push", data.scheduled ? `notification scheduled for ${new Date(data.send_at).toISOString()}` : "notification not scheduled");
    if (!data.scheduled && state.pushOn) toast(t("noPushSchedule"));
  } else {
    log.warn("tap", "recordTap: not saved, restoring previous state");
    Object.assign(state, prev);
  }
  render();
  return !!data;
}

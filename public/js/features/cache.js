// 端末に残すキャッシュ。次の起動で、通信を待たずに前回の画面をすぐ表示するために使う。
import { CHARACTERS } from "../../data/gifts.js";
import { ensureGameData, hasGameData } from "./gamedata.js";
import { logicalMonth } from "./time.js";
import { DEMO, state, store } from "./state.js";
import { render } from "../screens/render.js";

// 前回のタイマー画面のデータ (裏で最新に更新する)
const bootKey = (uid) => `boot.${uid}`;
export function saveBootCache() {
  if (DEMO || !state.user) return;
  store.set(bootKey(state.user.uid), JSON.stringify({ month: state.calMonth, profile: state.profile, last_tap: state.lastTap, taps: state.monthTaps }));
}
export function loadBootCache(uid) {
  try {
    const c = JSON.parse(store.get(bootKey(uid), "", null) ?? "null");
    return c && c.month === logicalMonth(Date.now()) && Array.isArray(c.taps) ? c : null;
  } catch {
    return null;
  }
}
export const applyBoot = (c) => Object.assign(state, { profile: c.profile, lastTap: c.last_tap, monthTaps: c.taps, calMonth: c.month, calTaps: c.taps });

// 絆の記録も端末に残す。ゲームデータ (js/gamedata.js) の保存分と合わせて、絆タブを待たずに開けるようにする
const relKey = (uid) => `rel.${uid}`;
export function saveRelCache() {
  if (!DEMO && state.user) store.set(relKey(state.user.uid), JSON.stringify(state.relationship));
}

// 絆の画面で最初に選ぶキャラ (前回の選択、なければ先頭)
export function initBondChar() {
  state.bondChar ??= store.get(
    "char",
    CHARACTERS[0].key,
    CHARACTERS.map((c) => c.key),
  );
}

export function primeBond(uid) {
  let rel = null;
  try {
    rel = JSON.parse(store.get(relKey(uid), "", null) ?? "null");
  } catch {
    /* 保存分が壊れていれば使わない */
  }
  if (!Array.isArray(rel) || !hasGameData()) return;
  ensureGameData({ onUpdate: () => render() }).catch(() => {}); // 保存分を同期で適用し、更新の確認は裏で行う
  state.relationship = rel;
  initBondChar();
  state.bondReady = true;
}

// ログアウト(失効を含む): 前のユーザーのキャッシュを残さない
export function clearUserCaches() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("ct.boot.") || k.startsWith("ct.rel.")) localStorage.removeItem(k);
  } catch {
    /* 消せなくても動作する */
  }
}

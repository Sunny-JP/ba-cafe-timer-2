// アプリ全体の状態と、端末への設定の保存。
import { pushEnabled, pushSupported } from "./push.js";
import { logicalMonth } from "./time.js";
import { DEFAULT_ACCENT, MODES } from "../screens/views.js";
import { UPDATE_LOGS } from "./updates.js";

// /demo.html: 使い方ガイドのスクリーンショット用。見本のデータを表示するだけで、保存も通信もしない
export const DEMO = !!window.CT_DEMO;
// デモで操作できるのは、画面の切り替えなど表示だけのもの
export const DEMO_ACTIONS = new Set(["dd-toggle", "dd-pick", "gifts-scroll", "theme-toggle", "day", "settings", "doc", "mode", "accent-reset"]);

// CALENDAR_LIMITS.MIN: 旧実装の new Date(2025, 12, 1) は 2026-01-01。意図の確認待ち(設計書 §15)
export const CAL_MIN = "2026-01";

export const store = {
  get(k, fallback, allowed) {
    try {
      const v = localStorage.getItem(`ct.${k}`);
      return allowed ? (allowed.includes(v) ? v : fallback) : (v ?? fallback);
    } catch {
      return fallback;
    }
  },
  set(k, v) {
    if (DEMO) return; // デモの操作を本物のアプリの設定に残さない
    try {
      localStorage.setItem(`ct.${k}`, v);
    } catch {
      /* 保存できなくても動作する */
    }
  },
};

export const emptyProfile = () => ({ ticket1_time: null, ticket2_time: null, timezone: null });

export const state = {
  mode: store.get("mode", "auto", MODES),
  accent: /^#[0-9a-f]{6}$/i.test(store.get("accent", "", null) ?? "") ? store.get("accent", "", null) : DEFAULT_ACCENT,
  user: null,
  // 見ていない更新があるときだけ、タイマー画面の Next Tap の上にお知らせを出す (閉じると以後出さない)
  notice: DEMO ? null : UPDATE_LOGS[0] && store.get("seenUpdate", "") !== UPDATE_LOGS[0].id ? UPDATE_LOGS[0] : null,
  tab: "timer",
  profile: emptyProfile(),
  lastTap: null,
  monthTaps: [], // 当月のタップ (タイマーの枠表示用)
  bondChar: null, // ゲームデータの読み込み後に決める (loadAll)
  bondLevel: null,
  bondDate: null,
  relationship: [],
  calMonth: logicalMonth(Date.now()),
  calTaps: [],
  calLoading: false,
  bondReady: false, // 絆の記録とゲームデータを読み終えたか (絆の画面はそれまで読み込み表示)
  deferredLoading: false,
  loading: false, // ログイン直後のデータ取得中。中身が空の画面の代わりに読み込み表示を出す
  pending: new Set(), // 処理中のボタン ("tap" / "ticket1" / "ticket2")。ラベルを Loading… にして無効にする
  selectedDay: null,
  pushSupported: pushSupported(),
  pushOn: pushEnabled(),
};

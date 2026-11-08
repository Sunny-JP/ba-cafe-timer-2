// 起動・タブ切替・状態管理。
import { ReauthRequired, login, logout, onUser, preloadGsi, requestDriveCode } from "./auth.js";
import { ApiError, api } from "./api.js";
import { applyStatic, getLang, setLang, t } from "./i18n.js";
import { disablePush, enablePush, pushEnabled, pushSupported, showForegroundNotifications } from "./push.js";
import { BOND_EXP, BOND_MAX, CHARACTERS } from "../data/gifts.js";
import { clearGameDataCache, ensureGameData, hasGameData } from "./gamedata.js";
import { logicalMonth, nextMonth, prevMonth, uuidv7 } from "./time.js";
import { noticeBanner, DEFAULT_ACCENT, MODES, WEEKDAYS, bondRecords, dayCounts, heatLevel, icon, langPicker, loader, renderBond, renderCalendar, renderDoc, renderLogList, renderMenu, renderSettings, renderTimer, skeleton, tick } from "./views.js";
import { UPDATE_LOGS } from "./updates.js";

// /demo.html: 使い方ガイドのスクリーンショット用。見本のデータを表示するだけで、保存も通信もしない
const DEMO = !!window.CT_DEMO;
// デモで操作できるのは、画面の切り替えなど表示だけのもの
const DEMO_ACTIONS = new Set(["dd-toggle", "dd-pick", "gifts-scroll", "theme-toggle", "day", "settings", "doc", "mode", "accent-reset"]);

// CALENDAR_LIMITS.MIN: 旧実装の new Date(2025, 12, 1) は 2026-01-01。意図の確認待ち(設計書 §15)
const CAL_MIN = "2026-01";

const $ = (sel) => document.querySelector(sel);
const view = $("#view");
const toast = (msg) => {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 3500);
};

// 処理中の表示。モーダルなので背面の操作はできず、Esc でも閉じない。
const busy = {
  show(msg, step = 0) {
    const dlg = $("#busy");
    if (!dlg.open) dlg.showModal();
    $("#busy-msg").textContent = msg;
    $("#busy-bar").value = step;
  },
  hide: () => $("#busy").close(),
};
$("#busy").addEventListener("cancel", (e) => e.preventDefault());

// 取り込み・消去の前に、メニューを閉じてタイマー画面へ戻る
function toTimerScreen() {
  if ($("#menu").open) $("#menu").close();
  state.tab = "timer";
  render(true);
  scrollTo(0, 0);
}

// ブラウザ標準の confirm の代わりに使う独自の確認ダイアログ
function confirmDialog(message, okLabel, danger = false) {
  const dlg = $("#confirm");
  $("#confirm-msg").textContent = message;
  const ok = $("#confirm-ok");
  ok.textContent = okLabel;
  ok.classList.toggle("danger", danger);
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => {
    const done = (v) => {
      dlg.close(v ? "ok" : "");
    };
    ok.onclick = () => done(true);
    $("#confirm-cancel").onclick = () => done(false);
    dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true });
  });
}

const store = {
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

const state = {
  mode: store.get("mode", "auto", MODES),
  accent: /^#[0-9a-f]{6}$/i.test(store.get("accent", "", null) ?? "") ? store.get("accent", "", null) : DEFAULT_ACCENT,
  user: null,
  // 見ていない更新があるときだけ、タイマー画面の Next Tap の上にお知らせを出す (閉じると以後出さない)
  notice: DEMO ? null : UPDATE_LOGS[0] && store.get("seenUpdate", "") !== UPDATE_LOGS[0].id ? UPDATE_LOGS[0] : null,
  tab: "timer",
  profile: { ticket1_time: null, ticket2_time: null, timezone: null },
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

const wide = matchMedia("(min-width: 900px) and (orientation: landscape)");

function render(animate = false) {
  state.calMinMonth = CAL_MIN;
  state.calMaxMonth = logicalMonth(Date.now());
  state.calAtMin = state.calMonth <= state.calMinMonth;
  state.calAtMax = state.calMonth >= state.calMaxMonth;
  // 横長の画面ではタイマーとカレンダーを並べて表示する(カレンダーのタブは隠れる)
  const tab = wide.matches && state.tab === "calendar" ? "timer" : state.tab;
  view.innerHTML = state.loading ? skeleton() : tab === "timer" && wide.matches ? `<div class="cols"><div>${renderTimer(state)}</div><div>${renderCalendar(state)}</div></div>` : { timer: renderTimer, calendar: renderCalendar, bond: renderBond, settings: renderSettings, doc: renderDoc }[tab](state);
  if ($("#menu").open) renderMenuBody();
  // 更新のお知らせ: ヘッダーの下に出す (タイマー画面のときだけ)
  const nb = $("#notice");
  if (nb) {
    const on = tab === "timer" && !!state.notice;
    nb.hidden = !on;
    nb.innerHTML = on ? noticeBanner(state.notice) : "";
  }
  tick(view);
  for (const b of document.querySelectorAll("nav button")) b.setAttribute("aria-selected", b.dataset.tab === tab);
  drawChart();
  updateGiftNav();
  lockDemo(view);
  if (animate) {
    // 画面遷移時だけ短いフェードイン(再描画のたびには動かさない)
    view.classList.remove("enter");
    void view.offsetWidth;
    view.classList.add("enter");
  }
}

// 贈物の一覧に続きがあるとき、端のぼかしと矢印で横スクロールできることを示す
function updateGiftNav() {
  for (const wrap of document.querySelectorAll(".gifts-wrap")) {
    const list = wrap.querySelector(".gifts");
    const left = list.scrollLeft > 1;
    const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
    wrap.querySelector(".prev").classList.toggle("show", left);
    wrap.querySelector(".next").classList.toggle("show", right);
    list.dataset.fade = (left ? "l" : "") + (right ? "r" : "");
  }
}
document.addEventListener("scroll", (e) => e.target.classList?.contains("gifts") && updateGiftNav(), true);
addEventListener("resize", updateGiftNav);

// テーマ色(light-dark() 解決後)を取得する
const css = (name) => {
  const el = document.createElement("div");
  el.style.color = `var(${name})`;
  document.body.append(el);
  const c = getComputedStyle(el).color;
  el.remove();
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  px.fillStyle = c;
  px.fillRect(0, 0, 1, 1);
  const [r, g, b] = px.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
};

// 絆ランクの推移。最後の記録から平均ペースで RANK 100 まで延ばした予測を点線で重ねる。
let chart = null;
// Web フォントの読み込みが終わる前に描くと代替フォントで固まるので、読み込み後に描き直す
document.fonts?.ready.then(() => drawChart());
// 横方向で最も近い点を拾う。0番(補助点を含む描画用の線)は対象にせず、同じ位置の点は全て返す。
function registerRealNearest() {
  if (Chart.Interaction.modes.realNearest) return;
  Chart.Interaction.modes.realNearest = (c, e) => {
    let best = Infinity;
    let items = [];
    c.data.datasets.forEach((_ds, di) => {
      if (di === 0 || !c.isDatasetVisible(di)) return;
      c.getDatasetMeta(di).data.forEach((el, index) => {
        const d = Math.abs(el.x - e.x);
        if (d < best - 0.5) {
          best = d;
          items = [{ element: el, datasetIndex: di, index }];
        } else if (Math.abs(d - best) <= 0.5) {
          items.push({ element: el, datasetIndex: di, index });
        }
      });
    });
    return items;
  };
}
// Chart.js (約60KB) は絆タブのグラフを描くときに初めて読み込む
let chartLoading = null;
function ensureChart() {
  if (window.Chart) return Promise.resolve();
  chartLoading ??= new Promise((resolve) => {
    const el = document.createElement("script");
    el.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    el.onload = resolve;
    el.onerror = () => {
      chartLoading = null; // 次の描画でやり直す
      resolve();
    };
    document.head.append(el);
  });
  return chartLoading;
}
function drawChart() {
  chart?.destroy();
  chart = null;
  const canvas = $("#chart");
  if (!canvas) return;
  if (!window.Chart) {
    ensureChart().then(() => window.Chart && $("#chart") && drawChart());
    return;
  }
  registerRealNearest();
  // 軸・小ウインドウの文字はグラフ設定ではなく Chart.defaults から決まるので、アプリのフォントをここで指定する
  Chart.defaults.font.family = getComputedStyle(canvas).fontFamily;
  const day = (s) => Date.parse(`${s}T00:00:00Z`);
  const pts = bondRecords(state, state.bondChar)
    .map((b) => ({ x: day(b.recorded_at), y: BOND_EXP[b.bond_level], rank: b.bond_level })) // 縦軸は累計EXP
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (!pts.length) return;
  // 同じ日に複数記録がある日は、上下に補助点(同じ x)を足す。曲線がその日の縦線に垂直に出入りし、角で横に膨らまない。
  const line = [];
  for (let i = 0; i < pts.length; ) {
    let j = i;
    while (j + 1 < pts.length && pts[j + 1].x === pts[i].x) j++;
    const lo = pts[i];
    const hi = pts[j];
    const near = (a, b) => Math.min(BOND_EXP[100] * 0.02, Math.abs(a - b) / 2);
    if (j > i && i > 0) line.push({ x: lo.x, y: lo.y - near(lo.y, pts[i - 1].y), helper: true });
    line.push(...pts.slice(i, j + 1));
    if (j > i && j + 1 < pts.length) line.push({ x: hi.x, y: hi.y + near(pts[j + 1].y, hi.y), helper: true });
    i = j + 1;
  }
  const first = pts[0];
  const last = pts.at(-1);
  const rate = last.x > first.x ? (last.y - first.y) / (last.x - first.x) : 0;
  const maxExp = BOND_EXP[100];
  // 予測は現在のランクより上の、5の倍数ランクごとに点を置く(最後は RANK 100)
  const proj = [];
  if (rate > 0 && last.y < maxExp) {
    proj.push(last);
    for (let l = 5; l <= 100; l += 5) {
      if (BOND_EXP[l] > last.y) proj.push({ x: last.x + (BOND_EXP[l] - last.y) / rate, y: BOND_EXP[l], rank: l, forecast: true });
    }
  }
  const ymd = (ms) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  };
  const primary = css("--primary");
  const grid = css("--outline");
  const text = css("--on-variant");
  const ym = (ms) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  chart = new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          data: line,
          tension: 0.25,
          borderColor: primary,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: "origin",
          backgroundColor: ({ chart: c }) => {
            const a = c.chartArea;
            if (!a) return "transparent";
            const g = c.ctx.createLinearGradient(0, a.top, 0, a.bottom);
            g.addColorStop(0, primary.replace("rgb(", "rgba(").replace(")", ", .35)"));
            g.addColorStop(1, "transparent");
            return g;
          },
        },
        // 当たり判定専用: 実際の記録だけを持ち、線は描かない(補助点を含む上の線は対象外)
        { data: pts, showLine: false, borderWidth: 0, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: primary },
        {
          data: proj,
          borderColor: primary,
          borderDash: [6, 5],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: primary,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      // 描画自体は即時にし、小ウインドウ(tooltip)だけが点の移動に合わせて滑らかに動く
      animation: { duration: 0 },
      transitions: { active: { animation: { duration: 0 } } },
      // 拡大してもぼやけないよう、画面の解像度より高い密度で描く
      devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      // ホバー(スマホではタップ)で最も近い点を拾い、小ウインドウが追従する
      interaction: { mode: "realNearest", axis: "x", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: css("--on-surface"),
          titleColor: css("--surface"),
          bodyColor: css("--surface"),
          padding: 10,
          animation: { duration: 180, easing: "easeOutCubic" },
          displayColors: false,
          mode: "realNearest",
          intersect: false,
          axis: "x",
          position: "nearest",
          filter: (_it, i) => i === 0, // 候補が複数あっても1つの小ウインドウにまとめる
          callbacks: {
            title: ([it]) => `${ymd(it.raw.x)}${it.raw.forecast ? ` (${t("forecast")})` : ""}`,
            // 同じ日の記録を、ランクが高い順に1行ずつ表示する
            label: (it) => {
              const ranks = new Map();
              for (const p of [...pts, ...proj]) if (p.x === it.raw.x) ranks.set(p.rank, p);
              return [...ranks.values()].sort((a, b) => b.rank - a.rank).map((p) => `RANK ${p.rank}  /  EXP ${p.y.toLocaleString()}`);
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: first.x,
          max: proj.length ? proj.at(-1).x : last.x + 30 * 864e5,
          grid: { color: grid },
          ticks: { color: text, callback: (v) => ym(v) },
          afterBuildTicks(scale) {
            // 月初に目盛りを置き、多すぎる場合は間引く
            const out = [];
            const d = new Date(scale.min);
            d.setUTCDate(1);
            d.setUTCHours(0, 0, 0, 0);
            for (; d.getTime() <= scale.max; d.setUTCMonth(d.getUTCMonth() + 1)) {
              if (d.getTime() >= scale.min) out.push({ value: d.getTime() });
            }
            const step = Math.ceil(out.length / 6) || 1;
            scale.ticks = out.filter((_, i) => i % step === 0);
          },
        },
        y: {
          min: 0,
          max: maxExp,
          grid: { color: grid },
          ticks: { color: text, callback: (v) => Object.keys(BOND_EXP).find((l) => BOND_EXP[l] === v) ?? "" },
          afterBuildTicks(scale) {
            scale.ticks = [1, 50, 60, 70, 80, 90, 100].map((l) => ({ value: BOND_EXP[l] }));
          },
        },
      },
    },
  });
}

// 表示中の月のカレンダーを PNG として保存
function saveCalendarImage() {
  const [y, m] = state.calMonth.split("-").map(Number);
  const counts = dayCounts(state.calTaps);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const rows = Math.ceil((lead + days) / 7);
  const cell = 120;
  const pad = 24;
  const top = 120;
  const W = cell * 7 + pad * 2;
  const foot = 64; // 下の文言の分
  const H = top + cell * rows + foot;
  const canvas = document.createElement("canvas");
  // 出力は 1500x1500 (1:1) に固定。内容は縦横の収まる倍率で拡大し、中央に置く
  const SIZE = 1500;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const c = canvas.getContext("2d");
  const font = '"Noto Sans", "Noto Sans JP", sans-serif';
  c.fillStyle = css("--surface");
  c.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.min(SIZE / W, SIZE / H);
  c.translate((SIZE - W * scale) / 2, (SIZE - H * scale) / 2);
  c.scale(scale, scale);
  c.textAlign = "center";
  c.fillStyle = css("--on-surface");
  c.font = `500 44px ${font}`;
  c.fillText(`${y}. ${m}`, W / 2, 56);
  c.font = `500 22px ${font}`;
  c.fillStyle = css("--on-variant");
  WEEKDAYS.forEach((w, i) => c.fillText(w, pad + cell * i + cell / 2, 100));
  for (let d = 1; d <= days; d++) {
    const i = lead + d - 1;
    const x = pad + (i % 7) * cell + 4;
    const yy = top + Math.floor(i / 7) * cell + 4;
    const n = counts[`${state.calMonth}-${String(d).padStart(2, "0")}`] ?? 0;
    const lv = heatLevel(n);
    c.fillStyle = css("--container");
    c.beginPath();
    // アプリ内と同じ、右上が斜めに欠けた形
    const s = cell - 8;
    const cut = 16;
    c.moveTo(x, yy);
    c.lineTo(x + s - cut, yy);
    c.lineTo(x + s, yy + cut);
    c.lineTo(x + s, yy + s);
    c.lineTo(x, yy + s);
    c.closePath();
    c.fill();
    c.globalAlpha = lv * 0.08; // アプリ内と同じ: primary を 8% ずつ重ねる
    c.fillStyle = css("--primary");
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = css("--on-surface"); // 文字色は全段階で通常の文字色
    c.textAlign = "left";
    c.font = `500 22px ${font}`;
    c.fillText(String(d), x + 10, yy + 30);
    if (n) {
      c.textAlign = "right";
      c.font = `700 40px ${font}`;
      c.fillText(String(n), x + cell - 18, yy + cell - 22);
    }
  }
  c.textAlign = "center";
  c.fillStyle = css("--on-variant");
  c.font = `500 20px ${font}`;
  c.fillText("My Tap History by Cafe Timer 2", W / 2, H - 26);
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cafetimer-${state.calMonth}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

const dark = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (state.mode === "auto" ? dark.matches : state.mode === "dark");

function renderMenuBody() {
  $("#menu-body").innerHTML = renderMenu(state);
  lockDemo($("#menu-body"));
}

// デモ画面: 押しても何も起きない操作に印を付け、ファイルの選択(インポート)も開かないようにする
function lockDemo(root) {
  if (!DEMO) return;
  for (const el of root.querySelectorAll("[data-act]")) if (!DEMO_ACTIONS.has(el.dataset.act) && el.id !== "home-btn") el.dataset.demoOff = "";
  for (const input of root.querySelectorAll('input[type="file"]')) {
    input.disabled = true;
    input.closest("label")?.setAttribute("data-demo-off", "");
  }
}

function applyTheme() {
  const root = document.documentElement;
  if (state.mode === "auto") root.removeAttribute("data-mode");
  else root.dataset.mode = state.mode;
  root.style.setProperty("--accent", state.accent);
  $("#theme-btn").innerHTML = icon(isDark() ? "sun" : "moon");
  $("#theme-btn").setAttribute("aria-label", t(isDark() ? "toLight" : "toDark"));
}

// 文書は js/docs.js に キー→訳 で言語ごとにまとめてある(表示時に初めて読み込む)
let docsModule;
const loadDocs = () => (docsModule ??= import("./docs.js"));
// 変更履歴の印 (<ul class="log" data-update-log>) には js/updates.js の内容を差し込む
const withUpdateLog = (html) => html.replace(/<ul class="log" data-update-log(?:="")?><\/ul>/, () => renderLogList());
async function loadDoc(id) {
  const { html, translated } = (await loadDocs()).docHtml(id, getLang());
  return (translated ? "" : `<p class="note info">${t("docFallback")}</p>`) + withUpdateLog(html);
}

// 再認証のバナーを出す。Drive の認可画面 (Google Identity Services) は、ここで先に読み込んでおく
function showReauth() {
  $("#reauth").hidden = false;
  preloadGsi();
}

function show(screen) {
  for (const id of ["loading", "login", "app"]) $(`#${id}`).hidden = id !== screen;
}

// API 呼び出しの共通エラー処理。再認証が必要ならバナーを出す。
// ログインした直後に Drive が未連携だったときは、バナーを出さずにそのまま Drive の認可画面を開く。
// 開けなかった(ポップアップがブロックされた・閉じられた)ときだけ、従来どおりバナーの「再認証」にする。
let autoLink = false;
async function guarded(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ReauthRequired) {
      if (autoLink) {
        autoLink = false;
        try {
          await api.linkDrive(await requestDriveCode());
          $("#reauth").hidden = true;
          return await guarded(fn);
        } catch {
          /* 下のバナーで再認証してもらう */
        }
      }
      showReauth();
    } else toast(e.message);
    return undefined;
  }
}

// タイマー(と当月のカレンダー)に要る分だけ先に読んで表示し、絆とゲームデータは続けて裏で読む
// 前回のタイマー画面のデータを端末に残し、次の起動ですぐ表示する (裏で最新に更新する)
const bootKey = (uid) => `boot.${uid}`;
function saveBootCache() {
  if (DEMO || !state.user) return;
  store.set(bootKey(state.user.uid), JSON.stringify({ month: state.calMonth, profile: state.profile, last_tap: state.lastTap, taps: state.monthTaps }));
}
function loadBootCache(uid) {
  try {
    const c = JSON.parse(store.get(bootKey(uid), "", null) ?? "null");
    return c && c.month === logicalMonth(Date.now()) && Array.isArray(c.taps) ? c : null;
  } catch {
    return null;
  }
}
const applyBoot = (c) =>
  Object.assign(state, { profile: c.profile, lastTap: c.last_tap, monthTaps: c.taps, calMonth: c.month, calTaps: c.taps });

// 絆の記録も端末に残す。ゲームデータ (js/gamedata.js) の保存分と合わせて、絆タブを待たずに開けるようにする
const relKey = (uid) => `rel.${uid}`;
function saveRelCache() {
  if (!DEMO && state.user) store.set(relKey(state.user.uid), JSON.stringify(state.relationship));
}
function primeBond(uid) {
  let rel = null;
  try {
    rel = JSON.parse(store.get(relKey(uid), "", null) ?? "null");
  } catch {
    /* 保存分が壊れていれば使わない */
  }
  if (!Array.isArray(rel) || !hasGameData()) return;
  ensureGameData({ onUpdate: () => render() }).catch(() => {}); // 保存分を同期で適用し、更新の確認は裏で行う
  state.relationship = rel;
  state.bondChar ??= store.get(
    "char",
    CHARACTERS[0].key,
    CHARACTERS.map((c) => c.key),
  );
  state.bondReady = true;
}

async function loadAll() {
  const data = await guarded(() => api.bootstrap(logicalMonth(Date.now())));
  autoLink = false; // 連携済みだった場合は、あとで自動では開かない
  if (!data) return;
  Object.assign(state, {
    profile: data.profile,
    lastTap: data.last_tap,
    monthTaps: data.taps,
    calMonth: data.month,
    calTaps: data.taps,
    loading: false,
  });
  saveBootCache();
  render();
  loadDeferred();
}

// 絆の記録・EXP表・キャラ・贈物。サーバーから取得し、保存済みのゲームデータがあればすぐ使う (js/gamedata.js)
async function loadDeferred() {
  state.deferredLoading = true;
  const rel = await guarded(async () => {
    const [r] = await Promise.all([api.relationship(), ensureGameData({ onUpdate: () => render() })]);
    return r;
  });
  state.deferredLoading = false;
  if (!rel) return;
  state.relationship = rel.relationship;
  state.bondChar ??= store.get(
    "char",
    CHARACTERS[0].key,
    CHARACTERS.map((c) => c.key),
  );
  state.bondReady = true;
  saveRelCache();
  render();
}

async function loadCalendar(month) {
  state.calMonth = month;
  state.selectedDay = null;
  state.calLoading = true;
  render(true);
  const data = await guarded(() => api.taps(month));
  state.calLoading = false;
  if (data && data.month === state.calMonth) state.calTaps = data.taps;
  render();
}

async function saveProfile(patch) {
  const before = state.profile;
  state.profile = { ...before, ...patch };
  render();
  const data = await guarded(() => api.saveProfile(patch));
  state.profile = data ? data.profile : before;
  saveBootCache();
  render();
}

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
async function flushPendingTaps() {
  let list = loadPendingTaps();
  while (list.length) {
    try {
      await api.tap(list[0]);
    } catch (e) {
      // 通信・認証の問題なら残して次回へ。内容が不正(期限切れなど)なものは諦めて捨てる
      if (e instanceof ReauthRequired || !(e instanceof ApiError) || e.status >= 500 || e.status === 429) break;
    }
    list = list.slice(1);
    savePendingTaps(list);
  }
}

// ボタンを処理中表示(Loading…・無効)にして fn を実行する。処理中の連打は無視する
async function withPending(key, fn) {
  if (state.pending.has(key)) return;
  state.pending.add(key);
  render();
  try {
    await fn();
  } finally {
    state.pending.delete(key);
    render();
  }
}

// タップを記録する。記録できた(または端末に保存した)ら true
async function recordTap() {
  const prev = { lastTap: state.lastTap, monthTaps: state.monthTaps, calTaps: state.calTaps };
  const temp = { id: uuidv7(), tap_time: new Date().toISOString() };
  const onCurrent = state.calMonth === logicalMonth(Date.now());
  state.lastTap = temp; // 楽観的更新
  state.monthTaps = [...state.monthTaps, temp];
  if (onCurrent) state.calTaps = state.monthTaps;
  render();
  let data;
  try {
    data = await api.tap();
  } catch (e) {
    if (e instanceof ReauthRequired) {
      // 再認証が必要でもタップは失わない: 端末に保存し、連携し直したあとに送る
      savePendingTaps([...loadPendingTaps(), temp]);
      showReauth();
      toast(t("tapQueued"));
      render();
      return true;
    }
    toast(e.message);
  }
  if (data) {
    state.lastTap = data.tap;
    state.monthTaps = state.monthTaps.map((t) => (t === temp ? data.tap : t));
    if (onCurrent) state.calTaps = state.monthTaps;
    saveBootCache();
    console.log(
      data.scheduled
        ? `[push] 通知を予約しました: ${new Date(data.send_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} (JST)`
        : "[push] 通知は予約されませんでした",
    );
    if (!data.scheduled && state.pushOn) toast(t("noPushSchedule"));
  } else {
    Object.assign(state, prev);
  }
  render();
  return !!data;
}

const actions = {
  tap: () => withPending("tap", recordTap),
  // お知らせを押すと、更新情報 (運営者情報の変更履歴) のページを開き、この更新のお知らせは消す
  async "notice-open"() {
    if (state.notice) store.set("seenUpdate", state.notice.id);
    state.notice = null;
    state.doc = "operator";
    state.docHtml = await loadDoc(state.doc);
    state.tab = "doc";
    render(true);
    scrollTo(0, 0);
    document.querySelector("#view ul.log")?.scrollIntoView({ block: "start" });
  },
  "ticket-use": (b) => withPending(`ticket${b.dataset.n}`, () => saveProfile({ [`ticket${b.dataset.n}_time`]: new Date().toISOString() })),
  "dd-toggle"(b) {
    const list = b.nextElementSibling;
    const open = !list.classList.contains("open");
    closeDropdowns();
    list.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
    const q = list.querySelector(".dd-q");
    if (q) {
      q.value = "";
      filterDropdown(q);
      if (open) q.focus({ preventScroll: true });
    }
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  },
  "dd-pick"(b) {
    closeDropdowns();
    const { field, value } = b.dataset;
    if (field === "char") {
      state.bondChar = value;
      state.bondLevel = null;
      store.set("char", value);
      render();
    } else if (field === "cal-ym") {
      if (!DEMO && value !== state.calMonth) loadCalendar(value);
    } else if (field === "tz") {
      if (!DEMO) saveProfile({ timezone: value || null });
    } else if (field === "lang") {
      setLang(value, !DEMO);
      applyTheme();
      renderLoginLang();
      if ($("#about").open) loadDoc(loginDoc).then((html) => ($("#about-body").innerHTML = html));
      (state.tab === "doc" ? loadDoc(state.doc) : Promise.resolve(null)).then((html) => {
        if (html !== null) state.docHtml = html;
        if (state.user) render(); // ログイン前は描画する画面がない
      });
    }
  },
  "gifts-scroll"(b) {
    const list = b.parentElement.querySelector(".gifts");
    list.scrollBy({ left: Number(b.dataset.dir) * list.clientWidth * 0.8, behavior: "smooth" });
  },
  "save-image": saveCalendarImage,
  "theme-toggle"() {
    state.mode = isDark() ? "light" : "dark";
    store.set("mode", state.mode);
    applyTheme();
    render();
  },
  "export-data": () =>
    withPending("export-data", async () => {
      busy.show(t("exporting"), 1);
      let data;
      try {
        data = await guarded(() => api.exportData());
      } finally {
        busy.hide();
      }
      if (!data) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      a.download = `cafetimer-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast(t("exported", { taps: data.taps.length, bonds: data.relationship.length }));
    }),
  "cal-today": () => state.calMonth !== state.calMaxMonth && loadCalendar(state.calMaxMonth),
  "cal-prev": () => loadCalendar(prevMonth(state.calMonth)),
  "cal-next": () => loadCalendar(nextMonth(state.calMonth)),
  day(b) {
    state.selectedDay = b.dataset.day;
    render();
  },
  async "bond-del"(b) {
    if (!(await confirmDialog(t("confirmDelBond"), t("del"), true))) return;
    busy.show(t("deleting"), 1);
    let ok;
    try {
      ok = await guarded(() => api.deleteBond(b.dataset.id));
    } finally {
      busy.hide();
    }
    if (ok) {
      state.relationship = state.relationship.filter((x) => x.id !== b.dataset.id);
      saveRelCache();
      state.bondLevel = null;
      render();
    }
  },
  push: () =>
    withPending("push", () =>
      guarded(async () => {
        if (state.pushOn) await disablePush();
        else await enablePush();
        state.pushOn = pushEnabled();
      }),
    ),
  async doc(b) {
    state.doc = b.dataset.doc;
    state.docHtml = await loadDoc(state.doc);
    $("#menu").close();
    state.tab = "doc";
    render(true);
    scrollTo(0, 0);
  },
  mode(b) {
    state.mode = b.dataset.mode;
    store.set("mode", state.mode);
    applyTheme();
    render();
  },
  home() {
    if (state.tab === "timer") return scrollTo(0, 0);
    state.tab = "timer";
    render(true);
    scrollTo(0, 0);
  },
  settings() {
    $("#menu").close();
    state.tab = "settings";
    render(true);
  },
  "accent-reset"() {
    state.accent = DEFAULT_ACCENT;
    store.set("accent", state.accent);
    applyTheme();
    render();
  },
  async logout() {
    if (await confirmDialog(t("confirmLogout"), t("logout"))) return logout();
  },
  async "delete-account"() {
    if (!(await confirmDialog(t("confirmDelAccount"), t("del"), true))) return;
    toTimerScreen();
    busy.show(t("deleting"));
    let ok;
    try {
      ok = await guarded(() => api.deleteAccount());
    } finally {
      busy.hide();
    }
    if (ok) {
      toast(t("deleted"));
      await logout();
    }
  },
};

// ビューとメニューの両方で、data-act / data-form を委譲処理する
const closeDropdowns = () => {
  for (const l of document.querySelectorAll(".dd-list")) {
    l.classList.remove("open");
    l.previousElementSibling.setAttribute("aria-expanded", "false");
  }
};

// 検索窓の絞り込み。ひらがなはカタカナにそろえ、大文字小文字は区別しない
const norm = (s) => s.toLowerCase().replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
function filterDropdown(input) {
  const q = norm(input.value.trim());
  for (const li of input.closest(".dd-list").querySelectorAll("li[data-q]")) {
    li.hidden = !!q && !norm(li.dataset.q).includes(q);
  }
}
document.addEventListener("input", (e) => {
  if (e.target.matches(".dd-q")) filterDropdown(e.target);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dd")) closeDropdowns();
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const { act, n } = b.dataset;
  if (DEMO && !DEMO_ACTIONS.has(act)) return;
  actions[act]?.(b);
  // 押した結果で描き直されたボタンも、沈んだ状態からふわっと戻す
  if (!b.isConnected) {
    const { day } = b.dataset;
    const again = document.querySelector(`[data-act="${act}"]${n ? `[data-n="${n}"]` : ""}${day ? `[data-day="${day}"]` : ""}`);
    if (again) {
      again.classList.add("rebound");
      again.addEventListener("animationend", () => again.classList.remove("rebound"), { once: true });
    }
  }
});

$("#menu-btn").innerHTML = icon("menu");
$("#menu-btn").addEventListener("click", () => {
  renderMenuBody();
  $("#menu").showModal();
});
// ダイアログの外(背景)をクリックしたときだけ閉じる。ダイアログ内の余白では閉じない。
function closeOnOutsideClick(dialog) {
  dialog.addEventListener("click", (e) => {
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
}
closeOnOutsideClick($("#menu"));
closeOnOutsideClick($("#confirm"));
closeOnOutsideClick($("#about"));

// ログイン前の画面: 言語の選択と About
const renderLoginLang = () => ($("#login-lang").innerHTML = langPicker(getLang()));
renderLoginLang();
// ログイン前の画面から開く文書 (About / 使い方ガイド)。言語を切り替えたら開いている文書を読み直す
let loginDoc = "about";
for (const [btn, id] of [["#about-btn", "about"], ["#guide-btn", "guide"]]) {
  $(btn).addEventListener("click", async () => {
    loginDoc = id;
    $("#about-body").innerHTML = await loadDoc(id);
    $("#about").showModal();
  });
}
$("#about-close").addEventListener("click", () => $("#about").close());
dark.addEventListener("change", applyTheme);
wide.addEventListener("change", () => render(true));

const NAV_ICONS = { timer: "timer", calendar: "calendar", bond: "heart" };
for (const b of document.querySelectorAll("nav button")) b.innerHTML = icon(NAV_ICONS[b.dataset.tab], 28);

view.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (DEMO || e.target.dataset.form !== "bond") return;
  const f = new FormData(e.target);
  const bond = { char_key: state.bondChar, bond_level: Number(f.get("bond_level")), recorded_at: f.get("recorded_at") };
  // 送信中はボタンを無効にして回転アイコンを出す (再描画すると入力中の値が消えるので、ボタンだけ触る)
  const btn = e.target.querySelector(".record");
  if (btn.disabled) return;
  btn.disabled = true;
  btn.classList.add("busy");
  let data;
  try {
    data = await guarded(() => api.addBond(bond));
  } finally {
    btn.disabled = false;
    btn.classList.remove("busy");
  }
  if (data) {
    state.relationship = [...state.relationship, data.item];
    saveRelCache();
    state.bondLevel = null; // 次の RANK を初期値にする
    state.bondDate = bond.recorded_at;
    render();
  }
});

// カラーピッカーはドラッグ中に連続して発火するため、メニューは再描画せず色だけ反映する
document.addEventListener("input", (e) => {
  if (e.target.name === "bond_level") {
    // RANK は 1〜BOND_MAX の整数のみ
    const n = e.target.value.replace(/\D/g, "");
    e.target.value = n === "" ? "" : String(Math.min(BOND_MAX, Math.max(1, Number(n))));
    return;
  }
  if (e.target.dataset.form !== "accent") return;
  state.accent = e.target.value;
  store.set("accent", state.accent);
  applyTheme();
});

// インポートは <label> なので、ほかのボタンと同じようにキーボード (Enter / Space) でも開けるようにする
document.addEventListener("keydown", (e) => {
  const label = e.target instanceof Element && e.target.matches("label.menu-item") ? e.target : null;
  if (!label || (e.key !== "Enter" && e.key !== " ")) return;
  e.preventDefault();
  label.querySelector("input")?.click();
});

// 画像がない生徒は、アイコンを出さず名前だけにする (error は伝播しないので capture で受ける)
document.addEventListener("error", (e) => (e.target.classList?.contains("dd-icon") || e.target.classList?.contains("bond-icon")) && e.target.remove(), true);

document.addEventListener("change", async (e) => {
  const kind = e.target.dataset.form;
  if (DEMO && kind !== "bond-char") return;
  if (kind === "bond-char") {
    state.bondChar = e.target.value;
    state.bondLevel = null;
    store.set("char", state.bondChar);
    render();
  }
  if (kind === "tz") saveProfile({ timezone: e.target.value || null });
  if (kind === "import" && e.target.files[0]) {
    const file = e.target.files[0];
    e.target.value = "";
    toTimerScreen();
    busy.show(t("importReading"), 0);
    try {
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        return toast(t("badJson"));
      }
      busy.show(t("importSending", { taps: parsed?.taps?.length ?? 0, bonds: parsed?.relationship?.length ?? 0 }), 1);
      const r = await guarded(() => api.importData(parsed));
      if (r) {
        busy.show(t("importRefresh"), 2);
        await loadAll();
        toast(t("imported", { taps: r.taps, bonds: r.relationship, skipped: r.skipped }));
      }
    } finally {
      busy.hide();
    }
  }
});

document.querySelector("nav").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  if (state.tab === b.dataset.tab) return;
  state.tab = b.dataset.tab;
  render(true);
  if (!state.bondReady && !state.deferredLoading) loadDeferred(); // 裏の読み込みが失敗していたときのやり直し
});

$("#login-btn").addEventListener("click", async () => {
  autoLink = true; // ログイン後、未連携ならそのまま Drive の認可へ進む
  if (!(await guarded(login))) autoLink = false;
});
$("#reauth-btn").addEventListener("click", async () => {
  if (await guarded(async () => api.linkDrive(await requestDriveCode()))) {
    $("#reauth").hidden = true;
    await flushPendingTaps();
    loadAll();
  }
});

applyStatic();
applyTheme();

setInterval(() => tick(view), 1000);

if (DEMO) {
  const { applyDemo, demoLang } = __DEMO_BUILD__ ? await import("./demo.js") : {};
  // タイトル (Cafe Timer 2) は、本物のアプリへ戻るボタンにする
  $("#home-btn").addEventListener("click", () => location.assign("/"));
  // ログインも通信もせず、見本のデータで画面を出す
  if (demoLang) setLang(demoLang, false);
  applyDemo(state);
  applyTheme();
  show("app");
  if (state.tab === "doc") state.docHtml = await loadDoc(state.doc);
  render();
  if (new URLSearchParams(location.search).get("menu")) {
    renderMenuBody();
    $("#menu").showModal();
  }
} else {
  // 前回ログインしたユーザーの保存データがあれば、認証の確定 (数百ms〜1秒) を待たずに先に描画する。
  // 認証が別の結果になったとき (ログアウト済み・別ユーザー) は、下の onUser で切り替える。
  const hintUid = store.get("uid", "", null);
  let primed = false;
  const hintCache = hintUid && loadBootCache(hintUid);
  if (hintCache) {
    applyBoot(hintCache);
    primeBond(hintUid);
    state.user = { uid: hintUid };
    primed = true;
    show("app");
    render();
  }
  const resetUserData = () => {
    Object.assign(state, {
      profile: { ticket1_time: null, ticket2_time: null, timezone: null },
      lastTap: null,
      monthTaps: [],
      calTaps: [],
      relationship: [],
      bondReady: false,
      deferredLoading: false,
      selectedDay: null,
    });
  };

  onUser((user) => {
    if (primed && user?.uid !== hintUid) {
      resetUserData(); // 先に出していたのは別のユーザー (またはログアウト済み) のデータ
      primed = false;
    }
    state.user = user;
    if (!user) {
      // ログアウト(失効を含む): 端末のゲームデータと、前のユーザーの絆の記録を残さない
      clearGameDataCache();
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith("ct.boot.") || k.startsWith("ct.rel.")) localStorage.removeItem(k);
      } catch {
        /* 消せなくても動作する */
      }
      store.set("uid", "");
      Object.assign(state, { relationship: [], bondReady: false, deferredLoading: false });
      show("login");
      preloadGsi(); // ログイン後の Drive 連携ですぐ使えるように
      return;
    }
    store.set("uid", user.uid);
    show("app");
    if (!primed) {
      const cached = loadBootCache(user.uid);
      if (cached) applyBoot(cached);
      primeBond(user.uid);
      state.loading = !cached;
      render();
    }
    // 通知の受信設定 (firebase-messaging の読み込みを含む) は、画面が出たあとの空き時間に行う
    (window.requestIdleCallback ?? setTimeout)(() => showForegroundNotifications().catch(() => {}));
    flushPendingTaps()
      .then(loadAll)
      .finally(() => {
        // 取得に失敗した場合も、読み込み表示のまま止まらないようにする
        state.loading = false;
        render();
      });
  });
}

if (!DEMO && "serviceWorker" in navigator && !pushEnabled()) {
  // 通知を使わない場合も PWA としてインストール可能にするため登録する
  navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
}

// 入力欄以外ではコピー・選択・ドラッグを止める
const isField = (e) => e.target instanceof Element && e.target.closest("input, textarea");
for (const type of ["copy", "cut", "selectstart", "dragstart"]) {
  document.addEventListener(type, (e) => isField(e) || e.preventDefault());
}

// 横スクロールの一覧は、マウスホイールの縦回転でも動かせるようにする
document.addEventListener(
  "wheel",
  (e) => {
    const list = e.target instanceof Element && e.target.closest(".gifts");
    if (list && list.scrollWidth > list.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      list.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  },
  { passive: false },
);

// 絆ランクの推移グラフ (Chart.js)。
import { BOND_EXP } from "../../data/gifts.js";
import { t } from "../features/i18n.js";
import { state } from "../features/state.js";
import { css } from "./theme.js";
import { $ } from "./ui.js";
import { bondRecords } from "./views.js";

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
export function drawChart() {
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

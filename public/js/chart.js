import { BOND_EXP } from "./gamedata.js";
import { t } from "./i18n.js";
import { state } from "./state.js";
import { daysInMonth, leadingBlanks, padTwo } from "./time.js";
import { $, cssColor, downloadBlob } from "./ui.js";
import { WEEKDAYS, bondRecords, dayCounts, heatLevel } from "./views.js";

let Chart = null;
let chartLoading = null;
let chart = null;

function loadChartLibrary() {
  chartLoading ??= import("chart.js/auto").then(
    (module) => {
      Chart = module.default;
      module.Interaction.modes.realNearest = nearestRecords;
    },
    () => (chartLoading = null),
  );
  return chartLoading;
}

function nearestRecords(chartInstance, event) {
  let bestDistance = Infinity;
  let items = [];
  chartInstance.data.datasets.forEach((_dataset, datasetIndex) => {
    if (datasetIndex === 0 || !chartInstance.isDatasetVisible(datasetIndex)) return;
    chartInstance.getDatasetMeta(datasetIndex).data.forEach((element, index) => {
      const distance = Math.abs(element.x - event.x);
      const item = { element, datasetIndex, index };
      if (distance < bestDistance - 0.5) {
        bestDistance = distance;
        items = [item];
      } else if (Math.abs(distance - bestDistance) <= 0.5) items.push(item);
    });
  });
  return items;
}

document.fonts?.ready.then(() => drawChart());

const formatYearMonth = (time) => `${new Date(time).getUTCFullYear()}/${padTwo(new Date(time).getUTCMonth() + 1)}`;
const formatDate = (time) => `${formatYearMonth(time)}/${padTwo(new Date(time).getUTCDate())}`;

// 同じ日に複数の記録があると曲線が横に膨らむので、補助点を足す
function withHelperPoints(points) {
  const line = [];
  const offset = (from, to) => Math.min(BOND_EXP[100] * 0.02, Math.abs(from - to) / 2);
  for (let start = 0; start < points.length; ) {
    let end = start;
    while (end + 1 < points.length && points[end + 1].x === points[start].x) end++;
    if (end > start && start > 0) line.push({ x: points[start].x, y: points[start].y - offset(points[start].y, points[start - 1].y), helper: true });
    line.push(...points.slice(start, end + 1));
    if (end > start && end + 1 < points.length) line.push({ x: points[end].x, y: points[end].y + offset(points[end + 1].y, points[end].y), helper: true });
    start = end + 1;
  }
  return line;
}

function forecastPoints(first, last) {
  const expPerMs = last.x > first.x ? (last.y - first.y) / (last.x - first.x) : 0;
  if (expPerMs <= 0 || last.y >= BOND_EXP[100]) return [];
  const points = [last];
  for (let rank = 5; rank <= 100; rank += 5) {
    if (BOND_EXP[rank] > last.y) points.push({ x: last.x + (BOND_EXP[rank] - last.y) / expPerMs, y: BOND_EXP[rank], rank, forecast: true });
  }
  return points;
}

function monthTicks(scale) {
  const ticks = [];
  const date = new Date(scale.min);
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  for (; date.getTime() <= scale.max; date.setUTCMonth(date.getUTCMonth() + 1)) if (date.getTime() >= scale.min) ticks.push({ value: date.getTime() });
  const step = Math.ceil(ticks.length / 6) || 1;
  scale.ticks = ticks.filter((_, index) => index % step === 0);
}

export function drawChart() {
  chart?.destroy();
  chart = null;
  const canvas = $("#chart");
  if (!canvas) return;
  if (!Chart) return void loadChartLibrary().then(() => Chart && $("#chart") && drawChart());

  const records = bondRecords(state, state.bondChar)
    .map((item) => ({ x: Date.parse(`${item.recorded_at}T00:00:00Z`), y: BOND_EXP[item.bond_level], rank: item.bond_level }))
    .sort((first, second) => first.x - second.x || first.y - second.y);
  if (!records.length) return;
  const first = records[0];
  const last = records.at(-1);
  const forecast = forecastPoints(first, last);
  const primary = cssColor("--primary");
  const gridColor = cssColor("--outline");
  const textColor = cssColor("--on-variant");
  Chart.defaults.font.family = getComputedStyle(canvas).fontFamily;

  const areaFill = ({ chart: chartInstance }) => {
    const area = chartInstance.chartArea;
    if (!area) return "transparent";
    const gradient = chartInstance.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, primary.replace("rgb(", "rgba(").replace(")", ", .35)"));
    gradient.addColorStop(1, "transparent");
    return gradient;
  };
  const tooltipLines = (item) => {
    const sameDay = new Map();
    for (const point of [...records, ...forecast]) if (point.x === item.raw.x) sameDay.set(point.rank, point);
    return [...sameDay.values()].sort((first, second) => second.rank - first.rank).map((point) => `RANK ${point.rank}  /  EXP ${point.y.toLocaleString()}`);
  };

  chart = new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        { data: withHelperPoints(records), tension: 0.25, borderColor: primary, borderWidth: 2, pointRadius: 0, pointHoverRadius: 0, fill: "origin", backgroundColor: areaFill },
        { data: records, showLine: false, borderWidth: 0, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: primary },
        { data: forecast, borderColor: primary, borderDash: [6, 5], borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: primary },
      ],
    },
    options: {
      maintainAspectRatio: false,
      animation: { duration: 0 },
      transitions: { active: { animation: { duration: 0 } } },
      devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      interaction: { mode: "realNearest", axis: "x", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssColor("--on-surface"),
          titleColor: cssColor("--surface"),
          bodyColor: cssColor("--surface"),
          padding: 10,
          animation: { duration: 180, easing: "easeOutCubic" },
          displayColors: false,
          mode: "realNearest",
          intersect: false,
          axis: "x",
          position: "nearest",
          filter: (_item, index) => index === 0,
          callbacks: {
            title: ([item]) => `${formatDate(item.raw.x)}${item.raw.forecast ? ` (${t("forecast")})` : ""}`,
            label: tooltipLines,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: first.x,
          max: forecast.length ? forecast.at(-1).x : last.x + 30 * 864e5,
          grid: { color: gridColor },
          ticks: { color: textColor, callback: formatYearMonth },
          afterBuildTicks: monthTicks,
        },
        y: {
          min: 0,
          max: BOND_EXP[100],
          grid: { color: gridColor },
          ticks: { color: textColor, callback: (value) => Object.keys(BOND_EXP).find((rank) => BOND_EXP[rank] === value) ?? "" },
          afterBuildTicks(scale) {
            scale.ticks = [1, 50, 60, 70, 80, 90, 100].map((rank) => ({ value: BOND_EXP[rank] }));
          },
        },
      },
    },
  });
}

export function saveCalendarImage() {
  const month = state.calMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const counts = dayCounts(state.calTaps);
  const blanks = leadingBlanks(month);
  const days = daysInMonth(month);
  const CELL = 120;
  const PADDING = 24;
  const TOP = 120;
  const SIZE = 1500;
  const FONT = '"Noto Sans", "Noto Sans JP", sans-serif';
  const width = CELL * 7 + PADDING * 2;
  const height = TOP + CELL * Math.ceil((blanks + days) / 7) + 64;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext("2d");
  context.fillStyle = cssColor("--surface");
  context.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.min(SIZE / width, SIZE / height);
  context.translate((SIZE - width * scale) / 2, (SIZE - height * scale) / 2);
  context.scale(scale, scale);

  context.textAlign = "center";
  context.fillStyle = cssColor("--on-surface");
  context.font = `500 44px ${FONT}`;
  context.fillText(`${year}. ${monthNumber}`, width / 2, 56);
  context.font = `500 22px ${FONT}`;
  context.fillStyle = cssColor("--on-variant");
  WEEKDAYS.forEach((weekday, index) => context.fillText(weekday, PADDING + CELL * index + CELL / 2, 100));

  const cellSize = CELL - 8;
  const cornerCut = 16;
  for (let date = 1; date <= days; date++) {
    const index = blanks + date - 1;
    const left = PADDING + (index % 7) * CELL + 4;
    const top = TOP + Math.floor(index / 7) * CELL + 4;
    const count = counts[`${month}-${padTwo(date)}`] ?? 0;
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left + cellSize - cornerCut, top);
    context.lineTo(left + cellSize, top + cornerCut);
    context.lineTo(left + cellSize, top + cellSize);
    context.lineTo(left, top + cellSize);
    context.closePath();
    context.fillStyle = cssColor("--container");
    context.fill();
    context.globalAlpha = heatLevel(count) * 0.08;
    context.fillStyle = cssColor("--primary");
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = cssColor("--on-surface");
    context.textAlign = "left";
    context.font = `500 22px ${FONT}`;
    context.fillText(String(date), left + 10, top + 30);
    if (count) {
      context.textAlign = "right";
      context.font = `700 40px ${FONT}`;
      context.fillText(String(count), left + CELL - 18, top + CELL - 22);
    }
  }
  context.textAlign = "center";
  context.fillStyle = cssColor("--on-variant");
  context.font = `500 20px ${FONT}`;
  context.fillText("My Tap History by Cafe Timer 2", width / 2, height - 26);
  canvas.toBlob((blob) => downloadBlob(blob, `cafetimer-${month}.png`));
}

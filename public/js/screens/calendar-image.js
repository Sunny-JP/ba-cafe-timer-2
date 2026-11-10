// 表示中の月のカレンダーを PNG として保存する。
import { dayCounts, heatLevel, WEEKDAYS } from "./views.js";
import { state } from "../features/state.js";
import { css } from "./theme.js";
import { downloadBlob } from "./ui.js";

// 表示中の月のカレンダーを PNG として保存
export function saveCalendarImage() {
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
  canvas.toBlob((blob) => downloadBlob(blob, `cafetimer-${state.calMonth}.png`));
}

// デバッグ用ログ。ボタンを押したのに反映されない、といった報告の調査用。
// コンソールに [ct HH:MM:SS.mmm] 形式で出す。直近の分は window.ctLog() でまとめて取り出せる (ユーザーに送ってもらう用)。
const MAX = 300;
const buf = [];

const stamp = () => new Date().toISOString().slice(11, 23);

function emit(level, tag, msg, data) {
  const line = `[ct ${stamp()}] [${tag}] ${msg}`;
  buf.push(data === undefined ? line : `${line} ${safe(data)}`);
  if (buf.length > MAX) buf.shift();
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (data === undefined) fn(line);
  else fn(line, data);
}

function safe(data) {
  try {
    return data instanceof Error ? `${data.name}: ${data.message}` : JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export const log = {
  info: (tag, msg, data) => emit("info", tag, msg, data),
  warn: (tag, msg, data) => emit("warn", tag, msg, data),
  error: (tag, msg, data) => emit("error", tag, msg, data),
};

// コンソールで window.ctLog() と打つと、直近のログを1つの文字列で返す
window.ctLog = () => buf.join("\n");

window.addEventListener("error", (e) => log.error("window", "未処理エラー", `${e.message} (${e.filename}:${e.lineno})`));
window.addEventListener("unhandledrejection", (e) => log.error("window", "未処理のPromise拒否", e.reason instanceof Error ? e.reason : String(e.reason)));
window.addEventListener("online", () => log.info("net", "オンラインに復帰"));
window.addEventListener("offline", () => log.warn("net", "オフラインになった"));

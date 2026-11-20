// デモ画面 (public/demo.html) から、使い方ガイドや告知用のスクリーンショットを撮る。
//   node scripts/capture-guide.mjs                                  すべて撮る
//   node scripts/capture-guide.mjs timer bond --lang ja --device pc --mode light
// 出力: public/img/guide/<言語>/<画面>-<端末>-<モード>.png。端末ごとに画像の大きさはすべて同じ。
// Edge か Chrome を DevTools Protocol で動かし、アプリの表示とフォントの読み込みが終わってから撮る。
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const outputDir = path.join(publicDir, "img", "guide");

const SCALE = 2;
// 端末: CSS px。PC は横長レイアウト (幅 900px 以上) になる大きさ
const DEVICES = { phone: { width: 390, height: 844, mobile: true }, pc: { width: 1280, height: 800, mobile: false } };
const SHOTS = { timer: "tab=timer", calendar: "tab=calendar", bond: "tab=bond", menu: "tab=timer&menu=1", settings: "tab=settings" };
const LANGS = ["ja", "en", "ko", "zh"];
const MODES = ["dark", "light"];

function parseArguments(argv) {
  const options = { names: [], lang: LANGS, device: Object.keys(DEVICES), mode: MODES };
  let current = "names";
  for (const argument of argv) {
    if (argument.startsWith("--")) {
      current = argument.slice(2);
      if (!(current in options)) throw new Error(`不明なオプション: ${argument}`);
      options[current] = [];
    } else options[current].push(argument);
  }
  if (!options.names.length) options.names = Object.keys(SHOTS);
  const allowed = { names: Object.keys(SHOTS), lang: LANGS, device: Object.keys(DEVICES), mode: MODES };
  for (const [key, values] of Object.entries(options))
    for (const value of values) if (!allowed[key].includes(value)) throw new Error(`${key} に ${value} は使えません`);
  return options;
}

const CONTENT_TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };

function startServer() {
  const server = http.createServer((request, response) => {
    const filePath = path.join(publicDir, decodeURIComponent(new URL(request.url, "http://localhost").pathname));
    if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function findBrowser() {
  const candidates = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ];
  const browser = candidates.find((candidate) => fs.existsSync(candidate));
  if (!browser) throw new Error("Edge / Chrome が見つかりません");
  return browser;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function launchBrowser(profileDir) {
  // 親が Chromium 系のとき残る変数。付いたままだとブラウザが何も出さずに終了する
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("CHROME_")));
  const browserProcess = spawn(findBrowser(), ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profileDir}`, "about:blank"], { env, stdio: "ignore" });
  const portFile = path.join(profileDir, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt++) await sleep(100);
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const pageTarget = targets.find((target) => target.type === "page");
  return { browserProcess, devtools: await connect(pageTarget.webSocketDebuggerUrl) };
}

// DevTools Protocol の送受信 (send でコマンド、waitFor でイベントを待つ)
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 1;
  const pending = new Map();
  const listeners = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    } else for (const listener of [...listeners]) listener(message);
  };
  return {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    waitFor(method) {
      return new Promise((resolve) => {
        const listener = (message) => {
          if (message.method !== method) return;
          listeners.splice(listeners.indexOf(listener), 1);
          resolve(message.params);
        };
        listeners.push(listener);
      });
    },
    close: () => socket.close(),
  };
}

// アプリが表示され、フォントが揃い、メニュー指定ならダイアログが開くまで待つ
const READY_CHECK = `(async () => {
  const app = document.getElementById("app");
  if (!app || app.hidden || !document.getElementById("loading").hidden) return false;
  if (new URLSearchParams(location.search).get("menu") && !document.getElementById("menu").open) return false;
  await document.fonts.ready;
  return true;
})()`;

async function capture(devtools, serverPort, { name, device, lang, mode }) {
  const { width, height, mobile } = DEVICES[device];
  await devtools.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: SCALE, mobile });
  await devtools.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: mode }] });
  const loaded = devtools.waitFor("Page.loadEventFired");
  await devtools.send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/demo.html?${SHOTS[name]}&lang=${lang}&mode=${mode}` });
  await loaded;
  for (let attempt = 0; ; attempt++) {
    const { result } = await devtools.send("Runtime.evaluate", { expression: READY_CHECK, awaitPromise: true, returnByValue: true });
    if (result.value) break;
    if (attempt > 100) throw new Error(`表示が終わりませんでした: ${name} ${device} ${lang} ${mode}`);
    await sleep(100);
  }
  await sleep(1000); // グラフやダイアログのアニメーションが終わるのを待つ
  const { data } = await devtools.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
  const destination = path.join(outputDir, lang, `${name}-${device}-${mode}.png`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(data, "base64"));
  console.log("wrote", path.relative(root, destination));
}

const options = parseArguments(process.argv.slice(2));
const server = await startServer();
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-guide-"));
const { browserProcess, devtools } = await launchBrowser(profileDir);
try {
  await devtools.send("Page.enable");
  for (const lang of options.lang)
    for (const device of options.device)
      for (const mode of options.mode)
        for (const name of options.names) {
          if (device === "pc" && name === "calendar") continue; // PC ではタイマー画面にカレンダーも並ぶ
          await capture(devtools, server.address().port, { name, device, lang, mode });
        }
} finally {
  await devtools.send("Browser.close").catch(() => browserProcess.kill());
  devtools.close();
  server.close();
  await new Promise((resolve) => (browserProcess.exitCode === null ? browserProcess.once("exit", resolve) : resolve()));
  // ブラウザの子プロセスが少し遅れてプロファイルを離すことがあるので、消せなくても止めない
  await sleep(1000);
  try {
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch {}
}

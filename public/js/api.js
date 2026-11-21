// ログ・ログイン (Firebase Auth と Drive 連携)・/api/* の呼び出し。DOM に依存しないので管理画面でも使う
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { DRIVE_SCOPE, GOOGLE_CLIENT_ID, firebaseConfig } from "./config.js";

// ---- ログ ----
// 一般ユーザーは要点だけ、管理者 (verbose) は本文も残す。直近分は window.ctLog() で取り出せる

const LOG_LIMIT = 300;
const LOG_BODY_LIMIT = 500;
const logLines = [];
let verbose = false;
try {
  verbose = localStorage.getItem("ct.verbose") === "1";
} catch {}

export function setVerbose(enabled) {
  verbose = enabled;
  try {
    if (enabled) localStorage.setItem("ct.verbose", "1");
    else localStorage.removeItem("ct.verbose");
  } catch {}
}

const truncate = (text) => (text.length > LOG_BODY_LIMIT ? `${text.slice(0, LOG_BODY_LIMIT)}…(${text.length})` : text);
const describe = (data) => {
  try {
    return data instanceof Error ? `${data.name}: ${data.message}` : truncate(JSON.stringify(data));
  } catch {
    return String(data);
  }
};

function writeLog(level, tag, message, data) {
  const head = `[ct ${new Date().toISOString().slice(11, 23)}] [${tag}] ${message}`;
  const line = data !== undefined && (verbose || data instanceof Error) ? `${head} ${describe(data)}` : head;
  logLines.push(line);
  if (logLines.length > LOG_LIMIT) logLines.shift();
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const log = {
  info: (tag, message, data) => writeLog("info", tag, message, data),
  warn: (tag, message, data) => writeLog("warn", tag, message, data),
  error: (tag, message, data) => writeLog("error", tag, message, data),
};

if (typeof window !== "undefined") {
  window.ctLog = () => logLines.join("\n");
  addEventListener("error", (event) => log.error("window", "uncaught error", `${event.message} (${event.filename}:${event.lineno})`));
  addEventListener("unhandledrejection", (event) => log.error("window", "unhandled rejection", event.reason instanceof Error ? event.reason : String(event.reason)));
  addEventListener("online", () => log.info("net", "online"));
  addEventListener("offline", () => log.warn("net", "offline"));
}

// ---- ログイン ----

export const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, () => {
    unsubscribe();
    resolve();
  });
});

export class ReauthRequired extends Error {}

export const onUser = (callback) => onAuthStateChanged(auth, callback);
export const login = async () => (await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver)).user;
export const logout = () => signOut(auth);

export async function getIdToken() {
  await authReady;
  if (!auth.currentUser) throw new ReauthRequired("not signed in");
  return auth.currentUser.getIdToken();
}

// Drive 連携は認可コードだけを受け取ってサーバーへ渡す (トークンはブラウザに残さない)
let gsiLoading = null;
export function preloadGsi() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gsiLoading ??= new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      gsiLoading = null;
      resolve();
    };
    document.head.append(script);
  });
  return gsiLoading;
}

export async function requestDriveCode() {
  await preloadGsi();
  return new Promise((resolve, reject) => {
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) return reject(new ReauthRequired("GIS unavailable"));
    oauth2
      .initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        ux_mode: "popup",
        hint: auth.currentUser?.email,
        prompt: "consent",
        callback: (response) => (response.code ? resolve(response.code) : reject(new ReauthRequired(response.error))),
        error_callback: (error) => reject(new ReauthRequired(error.type)),
      })
      .requestCode();
  });
}

// ---- /api/* ----

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SECRET_BODY_PATHS = new Set(["/api/auth/drive", "/api/export", "/api/import"]);
const bodyForLog = (path, text) => {
  if (text == null) return "";
  return SECRET_BODY_PATHS.has(path.split("?")[0]) ? ` body=(${text.length} chars)` : ` body=${truncate(text)}`;
};

// サーバーは Drive のファイルを丸ごと書き換えるので、書き込みは1本ずつ送る
let writeQueue = Promise.resolve();
function request(method, path, body) {
  if (method === "GET") return send(method, path, body);
  const sending = writeQueue.then(() => send(method, path, body));
  writeQueue = sending.catch(() => {});
  return sending;
}

let requestCount = 0;
// 送信を始めたあとにアプリを閉じても届くよう、書き込みは keepalive (本文 60KB 未満) で送る。
// Drive のトークン切れ (401 drive_token) は1回だけ再試行する
async function send(method, path, body, firstTry = true) {
  const tag = `#${++requestCount} ${method} ${path}`;
  const startedAt = performance.now();
  const elapsed = () => `${Math.round(performance.now() - startedAt)}ms`;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  if (verbose) log.info("api", `${tag} request${firstTry ? "" : " (retry)"}${bodyForLog(path, payload)}`);
  let response;
  let text;
  try {
    const headers = { Authorization: `Bearer ${await getIdToken()}` };
    if (payload !== undefined) headers["Content-Type"] = "application/json";
    const keepalive = method !== "GET" && (payload?.length ?? 0) < 60000;
    response = await fetch(path, { method, headers, body: payload, keepalive });
    text = await response.text();
  } catch (error) {
    log.error("api", `${tag} failed (${elapsed()}, online=${navigator.onLine})`, error);
    throw error;
  }
  log.info("api", `${tag} ${response.status} (${elapsed()})${verbose ? bodyForLog(path, text) : ""}`);
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  if (response.ok) return data;
  if (response.status === 401 && data.code === "drive_token") {
    if (firstTry) return send(method, path, body, false);
    throw new ReauthRequired(data.error);
  }
  throw new ApiError(response.status, data.error ?? `HTTP ${response.status}`, data.code);
}

export const api = {
  bootstrap: (month) => request("GET", `/api/bootstrap?month=${month}`),
  taps: (month) => request("GET", `/api/taps?month=${month}`),
  tap: (tap) => request("POST", "/api/taps", tap),
  saveProfile: (patch) => request("PUT", "/api/profile", patch),
  relationship: () => request("GET", "/api/relationship"),
  addBond: (bond) => request("POST", "/api/relationship", bond),
  deleteBond: (id) => request("DELETE", "/api/relationship", { id }),
  registerDevice: (token) => request("PUT", "/api/devices", { token }),
  unregisterDevice: (token) => request("DELETE", "/api/devices", { token }),
  gamedata: (version) => request("GET", `/api/gamedata${version ? `?v=${version}` : ""}`),
  catalog: () => request("GET", "/api/catalog"),
  linkDrive: (code) => request("POST", "/api/auth/drive", { code }),
  exportData: () => request("GET", "/api/export"),
  importData: (data) => request("POST", "/api/import", data),
  deleteAccount: () => request("DELETE", "/api/account"),
  adminMe: () => request("GET", "/api/admin/me"),
  adminStats: () => request("GET", "/api/admin/stats"),
  adminTestPush: () => request("POST", "/api/admin/test-push"),
  adminTestTap: (body) => request("POST", "/api/admin/test-tap", body),
  adminSaveCatalog: (catalog) => request("PUT", "/api/admin/catalog", catalog),
  adminAds: () => request("GET", "/api/admin/ads"),
  adminSetAds: (enabled) => request("PUT", "/api/admin/ads", { enabled }),
};

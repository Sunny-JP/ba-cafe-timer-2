import { uuidv7 } from "../public/js/time.js";

const base64UrlToBytes = (text) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
const bytesToBase64Url = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const jsonToBase64Url = (value) => bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));

const JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwkCache = { keys: null, expiresAt: 0 };

async function getPublicKeys() {
  if (jwkCache.keys && jwkCache.expiresAt > Date.now()) return jwkCache.keys;
  const response = await fetch(JWK_URL);
  if (!response.ok) throw new Error("jwk fetch failed");
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") || "")?.[1] || 3600);
  jwkCache = { keys: (await response.json()).keys, expiresAt: Date.now() + maxAge * 1000 };
  return jwkCache.keys;
}

export async function verifyIdToken(token, projectId) {
  try {
    const [headerPart, payloadPart, signaturePart] = token.split(".");
    const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerPart)));
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)));
    if (header.alg !== "RS256") return null;
    const jwk = (await getPublicKeys()).find((candidate) => candidate.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, base64UrlToBytes(signaturePart), signed);
    const now = Date.now() / 1000;
    if (!valid || payload.exp < now || payload.iat > now + 60) return null;
    if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    return typeof payload.sub === "string" && payload.sub ? payload : null;
  } catch {
    return null;
  }
}

let serviceTokenCache = { token: null, expiresAt: 0 };
let serviceTokenRequest = null;

function serviceToken(env) {
  if (serviceTokenCache.token && serviceTokenCache.expiresAt > Date.now() + 60000) return Promise.resolve(serviceTokenCache.token);
  serviceTokenRequest ??= requestServiceToken(env).finally(() => (serviceTokenRequest = null));
  return serviceTokenRequest;
}

// 起動直後の待ち時間を減らすため、先に取っておく
export function warmServiceToken(env) {
  if (env.FIREBASE_SERVICE_ACCOUNT) serviceToken(env).catch(() => {});
}

async function requestServiceToken(env) {
  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const scope = [
    "https://www.googleapis.com/auth/datastore",
    "https://www.googleapis.com/auth/firebase.messaging",
    "https://www.googleapis.com/auth/identitytoolkit",
  ].join(" ");
  const unsigned = `${jsonToBase64Url({ alg: "RS256", typ: "JWT" })}.${jsonToBase64Url({
    iss: account.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const keyBytes = base64UrlToBytes(account.private_key.replace(/-----[^-]+-----|\s/g, "").replace(/\+/g, "-").replace(/\//g, "_"));
  const key = await crypto.subtle.importKey("pkcs8", keyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${bytesToBase64Url(signature)}` }),
  });
  if (!response.ok) throw new Error("service account auth failed");
  const result = await response.json();
  serviceTokenCache = { token: result.access_token, expiresAt: Date.now() + result.expires_in * 1000 };
  return serviceTokenCache.token;
}

const documentsUrl = (env) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// 404 は例外にせず、呼び出し側で判定する
async function firestore(env, path, init = {}) {
  const response = await fetch(`${documentsUrl(env)}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await serviceToken(env)}` },
  });
  if (!response.ok && response.status !== 404) throw new Error(`firestore ${response.status}`);
  return response;
}

// 無いドキュメントを GET すると、ログに 404 のエラーとして残るので batchGet で読む。無いものは結果に含めない
async function getDocuments(env, paths) {
  const documents = paths.map((path) => `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents${path}`);
  const response = await firestore(env, ":batchGet", { method: "POST", body: JSON.stringify({ documents }) });
  if (!response.ok) throw new Error(`firestore ${response.status}`);
  return (await response.json()).flatMap((row) => row.found ?? []);
}

const getDocument = async (env, path) => (await getDocuments(env, [path]))[0] ?? null;

const writeJsonField = (env, path, value) =>
  firestore(env, path, { method: "PATCH", body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(value) } } }) });

async function readJsonField(env, path, fallback) {
  const document = await getDocument(env, path);
  try {
    return JSON.parse(document?.fields?.json?.stringValue ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getDevices(env, uid) {
  const document = await getDocument(env, `/devices/${uid}`);
  return document ? readTokens(document) : [];
}

const readTokens = (document) => (document.fields?.tokens?.arrayValue?.values ?? []).map((value) => value.stringValue);

async function getDevicesByUser(env, uids) {
  const documents = await getDocuments(env, uids.map((uid) => `/devices/${uid}`));
  return new Map(documents.map((document) => [document.name.split("/").pop(), readTokens(document)]));
}

export async function setDevices(env, uid, tokens) {
  if (!tokens.length) return void (await firestore(env, `/devices/${uid}`, { method: "DELETE" }));
  const values = tokens.map((stringValue) => ({ stringValue }));
  await firestore(env, `/devices/${uid}`, { method: "PATCH", body: JSON.stringify({ fields: { tokens: { arrayValue: { values } } } }) });
}

export async function getDriveAuth(env, uid) {
  return (await getDocument(env, `/driveAuth/${uid}`))?.fields?.enc?.stringValue ?? null;
}

export async function setDriveAuth(env, uid, encrypted) {
  await firestore(env, `/driveAuth/${uid}`, { method: "PATCH", body: JSON.stringify({ fields: { enc: { stringValue: encrypted } } }) });
}

export async function deleteDriveAuth(env, uid) {
  await firestore(env, `/driveAuth/${uid}`, { method: "DELETE" });
}

const EMPTY_CATALOG = { characters: [] };
let catalogCache = { value: null, expiresAt: 0 };

export async function getCatalog(env) {
  if (catalogCache.value && catalogCache.expiresAt > Date.now()) return catalogCache.value;
  const value = await readJsonField(env, "/config/catalog", EMPTY_CATALOG);
  catalogCache = { value, expiresAt: Date.now() + 30000 };
  return value;
}

export async function setCatalog(env, catalog) {
  await writeJsonField(env, "/config/catalog", catalog);
  catalogCache = { value: catalog, expiresAt: Date.now() + 30000 };
}

let adsConfigCache = { value: null, expiresAt: 0 };

export async function getAdsConfig(env) {
  if (adsConfigCache.value && adsConfigCache.expiresAt > Date.now()) return adsConfigCache.value;
  const value = await readJsonField(env, "/config/ads", { enabled: false });
  adsConfigCache = { value, expiresAt: Date.now() + 30000 };
  return value;
}

export async function setAdsConfig(env, config) {
  await writeJsonField(env, "/config/ads", config);
  adsConfigCache = { value: config, expiresAt: Date.now() + 30000 };
}

export async function addCounts(env, deltas) {
  const entries = Object.entries(deltas).filter(([, delta]) => delta);
  if (!entries.length) return;
  const document = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/stats/counters`;
  const fieldTransforms = entries.map(([statKey, delta]) => ({ fieldPath: `\`${statKey}\``, increment: { integerValue: String(delta) } }));
  await firestore(env, ":commit", { method: "POST", body: JSON.stringify({ writes: [{ transform: { document, fieldTransforms } }] }) });
}

export async function getCounts(env) {
  const fields = (await getDocument(env, "/stats/counters"))?.fields ?? {};
  return Object.fromEntries(Object.entries(fields).map(([statKey, value]) => [statKey, Number(value.integerValue ?? 0)]));
}

export async function countDevices(env) {
  const response = await firestore(env, ":runAggregationQuery", {
    method: "POST",
    body: JSON.stringify({
      structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: "devices" }] }, aggregations: [{ count: {}, alias: "n" }] },
    }),
  });
  return Number((await response.json())[0]?.result?.aggregateFields?.n?.integerValue ?? 0);
}

export const getBondStats = (env, uid) => readJsonField(env, `/statsBonds/${uid}`, {});
export const setBondStats = (env, uid, counts) => writeJsonField(env, `/statsBonds/${uid}`, counts);

const identityToolkit = async (env, action, body) =>
  fetch(`https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await serviceToken(env)}` },
    body: JSON.stringify(body),
  });

export async function countUsers(env) {
  try {
    const response = await identityToolkit(env, "accounts:query", { returnUserInfo: false });
    return response.ok ? Number((await response.json()).recordsCount ?? 0) : null;
  } catch {
    return null;
  }
}

export async function isAccountActive(env, uid, issuedAt) {
  const response = await identityToolkit(env, "accounts:lookup", { localId: [uid] });
  if (!response.ok) throw new Error(`identitytoolkit ${response.status}`);
  const user = (await response.json()).users?.[0];
  return !!user && !user.disabled && issuedAt >= Number(user.validSince ?? 0);
}

async function deleteAuthUser(env, uid) {
  const response = await identityToolkit(env, "accounts:delete", { localId: uid });
  if (!response.ok) throw new Error(`identitytoolkit ${response.status}`);
}

const pendingPath = (uid, id) => `/pending/${uid}_${id}`;

export async function addPending(env, uid, sendAt, id = uuidv7()) {
  const fields = { uid: { stringValue: uid }, sendAt: { timestampValue: new Date(sendAt).toISOString() } };
  await firestore(env, pendingPath(uid, id), { method: "PATCH", body: JSON.stringify({ fields }) });
}

export const removePending = (env, uid, id) => firestore(env, pendingPath(uid, id), { method: "DELETE" });

async function queryPending(env, where) {
  const response = await firestore(env, ":runQuery", {
    method: "POST",
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "pending" }], where, limit: 200 } }),
  });
  return (await response.json())
    .filter((row) => row.document)
    .map((row) => ({ name: row.document.name, uid: row.document.fields.uid.stringValue }));
}

async function deleteDocuments(env, names, { mustExist = false } = {}) {
  const writes = names.map((name) => ({ delete: name, ...(mustExist && { currentDocument: { exists: true } }) }));
  return (await firestore(env, ":commit", { method: "POST", body: JSON.stringify({ writes }) })).ok;
}

export async function deleteUserData(env, uid) {
  const contribution = await getBondStats(env, uid);
  await addCounts(env, Object.fromEntries(Object.entries(contribution).map(([statKey, count]) => [statKey, -count])));
  await firestore(env, `/statsBonds/${uid}`, { method: "DELETE" });
  await firestore(env, `/devices/${uid}`, { method: "DELETE" });
  await deleteDriveAuth(env, uid);
  const pending = await queryPending(env, { fieldFilter: { field: { fieldPath: "uid" }, op: "EQUAL", value: { stringValue: uid } } });
  if (pending.length) await deleteDocuments(env, pending.map((item) => item.name));
  await deleteAuthUser(env, uid);
}

const MESSAGES = [
  { title: "先生！お仕事お疲れ様です！", body: "生徒さんたちが待ってますよ！" },
  { title: "先生、お仕事お疲れ様です。", body: "生徒のみなさんがお待ちです。" },
];
const TEST_MESSAGE = { title: "テスト通知", body: "管理画面から送信されました。" };
const randomMessage = () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

async function sendFcm(env, token, message = randomMessage()) {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await serviceToken(env)}` },
    body: JSON.stringify({ message: { token, webpush: { notification: { ...message, icon: "/img/icon.svg" }, fcm_options: { link: "/" } } } }),
  });
  if (response.ok) return { result: "ok" };
  const code = (await response.json().catch(() => null))?.error?.status ?? "";
  return { result: response.status === 404 || response.status === 400 ? "gone" : "error", status: response.status, code };
}

async function sendToDevices(env, tokens, message, onResult) {
  const alive = await Promise.all(
    tokens.map(async (token) => {
      const sent = await sendFcm(env, token, message);
      onResult(sent);
      return sent.result === "gone" ? null : token;
    }),
  );
  return alive.filter(Boolean);
}

export async function sendTestNotification(env, uid) {
  const tokens = await getDevices(env, uid);
  const summary = { devices: tokens.length, ok: 0, gone: 0, error: 0, failures: [] };
  const alive = await sendToDevices(env, tokens, TEST_MESSAGE, (sent) => {
    summary[sent.result]++;
    if (sent.result !== "ok") summary.failures.push(`${sent.status} ${sent.code}`.trim());
  });
  if (alive.length !== tokens.length) await setDevices(env, uid, alive);
  return summary;
}

// 無料プランは 1 回の実行で外部への通信が 50 回まで。残りは次の分に送る
const SENDS_PER_RUN = 40;

const logFailure = (error) => console.error("send due notification failed", error?.message?.startsWith("firestore") ? error.message : error?.name);

export async function sendDueNotifications(env) {
  const due = await queryPending(env, {
    fieldFilter: { field: { fieldPath: "sendAt" }, op: "LESS_THAN_OR_EQUAL", value: { timestampValue: new Date().toISOString() } },
  });
  if (!due.length) return;
  const devices = await getDevicesByUser(env, [...new Set(due.map((item) => item.uid))]);
  const claimed = [];
  let sendCount = 0;
  for (const item of due) {
    sendCount += devices.get(item.uid)?.length ?? 0;
    if (sendCount > SENDS_PER_RUN) break;
    claimed.push(item);
  }
  // 二重に届かないよう送る前に予約を消す。別の実行が先に消していたら、何も送らない
  if (!(await deleteDocuments(env, claimed.map((item) => item.name), { mustExist: true }))) return;

  const stale = new Map();
  await Promise.all(
    claimed.map(async ({ uid }) => {
      const tokens = devices.get(uid) ?? [];
      try {
        const alive = await sendToDevices(env, tokens, undefined, (sent) => sent.result !== "ok" && console.error("fcm send failed", sent.status, sent.code));
        if (alive.length !== tokens.length) stale.set(uid, alive);
      } catch (error) {
        logFailure(error);
      }
    }),
  );
  for (const [uid, alive] of stale) await setDevices(env, uid, alive).catch(logFailure);
}

import { api, app } from "./api.js";
import { VAPID_KEY } from "./config.js";
import { t } from "./i18n.js";

const SW_URL = "/firebase-messaging-sw.js";
const KEY = "ct.push";
const loadMessaging = () => import("firebase/messaging");

export const pushSupported = () => "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
export const pushEnabled = () => pushSupported() && Notification.permission === "granted" && !!localStorage.getItem(KEY);
export const registerWorker = () => navigator.serviceWorker.register(SW_URL);

async function currentToken() {
  const { getMessaging, getToken } = await loadMessaging();
  return getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: await registerWorker() });
}

// フォーカス中のタブには SDK が通知を出さない
let listening = false;
export async function showForegroundNotifications() {
  if (listening || !pushEnabled()) return;
  listening = true;
  const { getMessaging, onMessage } = await loadMessaging();
  onMessage(getMessaging(app), async ({ notification = {} }) => {
    const { title = "", body = "", icon } = notification;
    (await navigator.serviceWorker.ready).showNotification(title, { body, icon });
  });
}

export async function enablePush() {
  if ((await Notification.requestPermission()) !== "granted") throw new Error(t("pushDenied"));
  await api.registerDevice(await currentToken());
  localStorage.setItem(KEY, "1");
  showForegroundNotifications();
}

export async function disablePush() {
  try {
    await api.unregisterDevice(await currentToken());
    const { getMessaging, deleteToken } = await loadMessaging();
    await deleteToken(getMessaging(app));
  } finally {
    localStorage.removeItem(KEY);
  }
}

// FCM (Web Push) の端末登録。
import { app } from "./auth.js";
import { api } from "./api.js";
import { t } from "./i18n.js";

// firebase-messaging (約28KB) は通知を使うときだけ読み込む
const loadMessaging = () => import("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js");

// TODO: Firebase コンソール > Cloud Messaging > Web プッシュ証明書の公開鍵
const VAPID_KEY = "BCrafp1_EqD1PwJio9gZgy4jYTOhVaYG4dR-vYjtrNJ3byscqyBzYt0i70RDtZVnZrWcYPs3pcH7-6DMzBSIuzE";

export const pushSupported = () => "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
export const pushEnabled = () => pushSupported() && Notification.permission === "granted" && !!localStorage.getItem("ct.push");

async function currentToken() {
  const { getMessaging, getToken } = await loadMessaging();
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  return getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

// 画面を開いている(フォーカス中の)タブには、SDK は通知を出さずにページへ渡すだけなので、ここで表示する
let listening = false;
export async function showForegroundNotifications() {
  if (listening || !pushEnabled()) return;
  listening = true;
  const { getMessaging, onMessage } = await loadMessaging();
  onMessage(getMessaging(app), async (payload) => {
    const { title = '', body = '', icon } = payload.notification ?? {};
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, { body, icon });
  });
}

export async function enablePush() {
  if ((await Notification.requestPermission()) !== "granted") throw new Error(t("pushDenied"));
  const token = await currentToken();
  await api.registerDevice(token);
  localStorage.setItem("ct.push", "1");
  showForegroundNotifications();
}

export async function disablePush() {
  try {
    const token = await currentToken();
    await api.unregisterDevice(token);
    const { getMessaging, deleteToken } = await loadMessaging();
    await deleteToken(getMessaging(app));
  } finally {
    localStorage.removeItem("ct.push");
  }
}

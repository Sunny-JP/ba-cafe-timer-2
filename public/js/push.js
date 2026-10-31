// FCM (Web Push) の端末登録。
import { getMessaging, getToken, deleteToken } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js";
import { app } from "./auth.js";
import { api } from "./api.js";
import { t } from "./i18n.js";

// TODO: Firebase コンソール > Cloud Messaging > Web プッシュ証明書の公開鍵
const VAPID_KEY = "BCrafp1_EqD1PwJio9gZgy4jYTOhVaYG4dR-vYjtrNJ3byscqyBzYt0i70RDtZVnZrWcYPs3pcH7-6DMzBSIuzE";

export const pushSupported = () => "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
export const pushEnabled = () => pushSupported() && Notification.permission === "granted" && !!localStorage.getItem("ct.push");

async function currentToken() {
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  return getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
}

export async function enablePush() {
  if ((await Notification.requestPermission()) !== "granted") throw new Error(t("pushDenied"));
  const token = await currentToken();
  await api.registerDevice(token);
  localStorage.setItem("ct.push", "1");
}

export async function disablePush() {
  try {
    const token = await currentToken();
    await api.unregisterDevice(token);
    await deleteToken(getMessaging(app));
  } finally {
    localStorage.removeItem("ct.push");
  }
}

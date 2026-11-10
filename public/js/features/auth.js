// Google ログイン(Firebase Auth)と Drive アクセストークンの取得。
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// TODO: Firebase コンソールの値に置き換える (firebase-messaging-sw.js にも同じ値が必要)
export const firebaseConfig = {
  apiKey: "AIzaSyCyC07Txb42uJD81IB2W3zuHspu0Ximd7A",
  authDomain: "ba-cafe-timer-2.firebaseapp.com",
  projectId: "ba-cafe-timer-2",
  storageBucket: "ba-cafe-timer-2.firebasestorage.app",
  messagingSenderId: "628000422074",
  appId: "1:628000422074:web:5ab8993694118bda45ea83",
  measurementId: "G-9NNR3Y3H10",
};
// Google Cloud の OAuth ウェブクライアント ID (Drive 連携の認可コード取得用)
const GOOGLE_CLIENT_ID = "628000422074-hrfs7ptufkgvcbd0p2cuu1qdlb5sd52u.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

export const app = initializeApp(firebaseConfig);
// ポップアップ用の部品 (gapi・iframe 計 約130KB) は initializeAuth に渡さず、ログインのときだけ読み込む。
// 保存済みのログインはこれまでと同じ IndexedDB から復元される。
const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });

// 最初のログイン状態が決まるまで待つための Promise。保存済みデータで先に描画したあとのタップは、これを待ってから送る
const ready = new Promise((resolve) => {
  const stop = onAuthStateChanged(auth, () => {
    stop();
    resolve();
  });
});

export class ReauthRequired extends Error {}

export function onUser(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function login() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export async function getIdToken() {
  await ready;
  if (!auth.currentUser) throw new ReauthRequired("not signed in");
  return auth.currentUser.getIdToken();
}

// Drive 連携: 認可コードだけをブラウザで受け取り、サーバーへ渡す(トークンはブラウザに残さない)。
// 初回(または連携が取り消されたとき)だけ必要で、ボタンのタップから呼ぶこと。
// Google Identity Services は、ログイン画面や再連携のときだけ読み込む (初回表示では不要で、約100KB)
let gsiLoading = null;
export function preloadGsi() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gsiLoading ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => {
      gsiLoading = null; // 次の機会にやり直す
      resolve();
    };
    document.head.append(s);
  });
  return gsiLoading;
}

export async function requestDriveCode() {
  await preloadGsi();
  return new Promise((resolve, reject) => {
    const gis = window.google?.accounts?.oauth2;
    if (!gis) return reject(new ReauthRequired("GIS unavailable"));
    gis
      .initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        ux_mode: "popup",
        hint: auth.currentUser?.email,
        prompt: "consent", // リフレッシュトークンを確実に受け取る
        callback: (res) => (res.code ? resolve(res.code) : reject(new ReauthRequired(res.error))),
        error_callback: (err) => reject(new ReauthRequired(err.type)),
      })
      .requestCode();
  });
}

// Google ログイン(Firebase Auth)と Drive アクセストークンの取得。
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

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
// Google Cloud の OAuth ウェブクライアント ID (無音更新用)
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const STORE_KEY = "ct.drive";

export const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export class ReauthRequired extends Error {}

const loadDrive = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY)) ?? null;
  } catch {
    return null;
  }
};
const saveDrive = (token, expiresIn = 3500) => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify({ token, exp: Date.now() + expiresIn * 1000 }));
  } catch {
    /* 保存できなくても動作する */
  }
};

export function onUser(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function login() {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  const result = await signInWithPopup(auth, provider);
  const cred = GoogleAuthProvider.credentialFromResult(result);
  if (cred?.accessToken) saveDrive(cred.accessToken);
  return result.user;
}

export async function logout() {
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* noop */
  }
  await signOut(auth);
}

export async function getIdToken() {
  if (!auth.currentUser) throw new ReauthRequired("not signed in");
  return auth.currentUser.getIdToken();
}

// Google Identity Services による無音更新
function silentRefresh() {
  return new Promise((resolve, reject) => {
    const gis = window.google?.accounts?.oauth2;
    if (!gis) return reject(new ReauthRequired("GIS unavailable"));
    const timer = setTimeout(() => reject(new ReauthRequired("timeout")), 8000);
    const client = gis.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      hint: auth.currentUser?.email,
      prompt: "",
      callback: (res) => {
        clearTimeout(timer);
        if (res.access_token) {
          saveDrive(res.access_token, Number(res.expires_in) || 3500);
          resolve(res.access_token);
        } else {
          reject(new ReauthRequired(res.error));
        }
      },
      error_callback: (err) => {
        clearTimeout(timer);
        reject(new ReauthRequired(err.type));
      },
    });
    client.requestAccessToken();
  });
}

// force=true: サーバーが 401 を返した場合など、期限内でも取り直す
export async function getDriveToken(force = false) {
  const saved = loadDrive();
  if (!force && saved && saved.exp > Date.now() + 60000) return saved.token;
  return silentRefresh();
}

// エントリーポイント。各モジュールの初期化と、起動処理の呼び出しだけを行う。
// フォルダの分け方:
//   screens/  : 画面 (描画・テーマ・ダイアログ・ログイン画面・文書の表示)
//   features/ : 機能 (状態・API・認証・データの読み書き・操作の処理・起動・多言語)
//   admin/    : 管理画面 (それぞれ別ページ)
import { applyStatic } from "./features/i18n.js";
import { pushEnabled } from "./features/push.js";
import { tick } from "./screens/views.js";
import { startApp, startDemo } from "./features/boot.js";
import { initEvents } from "./features/events.js";
import { initForms } from "./features/forms.js";
import { initLoginScreen } from "./screens/login-screen.js";
import { initRender } from "./screens/render.js";
import { DEMO } from "./features/state.js";
import { applyTheme, dark } from "./screens/theme.js";
import { view } from "./screens/ui.js";

initRender();
initEvents();
initForms();
initLoginScreen();
dark.addEventListener("change", applyTheme);

applyStatic();
applyTheme();

setInterval(() => tick(view), 1000);

if (DEMO) await startDemo();
else startApp();

if (!DEMO && "serviceWorker" in navigator && !pushEnabled()) {
  // 通知を使わない場合も PWA としてインストール可能にするため登録する
  navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});
}

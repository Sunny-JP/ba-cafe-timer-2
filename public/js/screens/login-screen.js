// ログイン前の画面 (言語の選択・About・使い方ガイド) と、ログイン / 再認証ボタン。
import { login, requestDriveCode } from "../features/auth.js";
import { api } from "../features/api.js";
import { getLang } from "../features/i18n.js";
import { log } from "../features/log.js";
import { langPicker } from "./views.js";
import { loadDoc } from "./doc.js";
import { guarded, link } from "../features/guard.js";
import { loadAll } from "../features/data.js";
import { flushPendingTaps } from "../features/taps.js";
import { $, closeOnOutsideClick } from "./ui.js";

export const renderLoginLang = () => ($("#login-lang").innerHTML = langPicker(getLang()));

// ログイン前の画面から開く文書 (About / 使い方ガイド)。言語を切り替えたら開いている文書を読み直す
let loginDoc = "about";
export const reloadLoginDoc = () => $("#about").open && loadDoc(loginDoc).then((html) => ($("#about-body").innerHTML = html));

export function initLoginScreen() {
  renderLoginLang();
  for (const [btn, id] of [["#about-btn", "about"], ["#guide-btn", "guide"]]) {
    $(btn).addEventListener("click", async () => {
      loginDoc = id;
      $("#about-body").innerHTML = await loadDoc(id);
      $("#about").showModal();
    });
  }
  $("#about-close").addEventListener("click", () => $("#about").close());
  closeOnOutsideClick($("#about"));

  $("#login-btn").addEventListener("click", async () => {
    log.info("auth", "login button clicked");
    link.auto = true; // ログイン後、未連携ならそのまま Drive の認可へ進む
    const u = await guarded(login);
    log.info("auth", u ? "login: success" : "login: failed or cancelled");
    if (!u) link.auto = false;
  });

  $("#reauth-btn").addEventListener("click", async () => {
    log.info("auth", "reauth button clicked");
    const ok = await guarded(async () => api.linkDrive(await requestDriveCode()));
    log.info("auth", ok ? "reauth: Drive linked" : "reauth: failed or cancelled");
    if (ok) {
      $("#reauth").hidden = true;
      await flushPendingTaps();
      loadAll();
    }
  });
}

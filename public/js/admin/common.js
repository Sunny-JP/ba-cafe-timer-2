// 管理ページ共通: ログイン・権限確認・ナビ。権限の判定はサーバー(ADMIN_UIDS)が行い、ここでは表示のみ。
// ページ自体は静的ファイルで認証前に配信される(ログインは Authorization ヘッダーのため)が、管理者でなければ / へ戻す。
import { login, logout, onUser } from "../auth.js";
import { api } from "../api.js";

export const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 3500);
}

const PAGES = [
  ["/admin/push", "通知"],
  ["/admin/stats", "統計"],
  ["/admin/taptest", "タップテスト"],
  ["/admin/characters", "キャラクター追加"],
];

// active: 現在のページのパス。管理者と確認できたら onReady を呼ぶ
export function initAdminPage(active, onReady) {
  $("#shell").innerHTML = `
    <div class="row" style="justify-content: space-between">
      <h1><a href="/admin/" style="text-decoration:none;color:inherit">Cafe Timer 2 管理</a></h1>
      <span><a href="/">アプリへ</a> <button id="logout-btn" class="ghost">ログアウト</button></span>
    </div>
    <nav class="adminnav">${PAGES.map(([href, label]) => `<a href="${href}"${href === active ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
    <p id="denied" class="err" hidden></p>`;
  $("#login-btn").onclick = () => login().catch((e) => toast(e.message));
  $("#logout-btn").onclick = () => logout();

  onUser(async (user) => {
    $("#login").hidden = !!user;
    $("#admin").hidden = true; // 管理者と確認できるまで中身は出さない
    if (!user) return;
    try {
      await api.adminMe(); // 管理者でなければ 403
    } catch (e) {
      // 管理者でないアカウントは管理ページに留めず、アプリへ戻す (履歴にも残さない)
      if (e.status === 403) return location.replace("/");
      $("#admin").hidden = false;
      $("#denied").hidden = false;
      $("#denied").textContent = e.message;
      $("#content").hidden = true;
      return;
    }
    $("#admin").hidden = false;
    $("#content").hidden = false;
    onReady(user);
  });
}

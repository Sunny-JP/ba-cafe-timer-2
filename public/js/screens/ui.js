// 画面の共通部品: DOM の取得、トースト、処理中表示、確認ダイアログ、ファイル保存。
import { log } from "../features/log.js";

export const $ = (sel) => document.querySelector(sel);
export const view = $("#view");

export const toast = (msg) => {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  log.info("toast", msg);
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 3500);
};

// 処理中の表示。モーダルなので背面の操作はできず、Esc でも閉じない。
export const busy = {
  show(msg, step = 0) {
    const dlg = $("#busy");
    if (!dlg.open) dlg.showModal();
    $("#busy-msg").textContent = msg;
    $("#busy-bar").value = step;
  },
  hide: () => $("#busy").close(),
};
$("#busy").addEventListener("cancel", (e) => e.preventDefault());

// 処理中の表示を出して fn を実行し、終わったら(失敗しても)閉じる
export async function withBusy(msg, step, fn) {
  busy.show(msg, step);
  try {
    return await fn();
  } finally {
    busy.hide();
  }
}

// ブラウザ標準の confirm の代わりに使う独自の確認ダイアログ
export function confirmDialog(message, okLabel, danger = false) {
  const dlg = $("#confirm");
  $("#confirm-msg").textContent = message;
  const ok = $("#confirm-ok");
  ok.textContent = okLabel;
  ok.classList.toggle("danger", danger);
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => {
    const done = (v) => dlg.close(v ? "ok" : "");
    ok.onclick = () => done(true);
    $("#confirm-cancel").onclick = () => done(false);
    dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true });
  });
}

// ダイアログの外(背景)をクリックしたときだけ閉じる。ダイアログ内の余白では閉じない。
export function closeOnOutsideClick(dialog) {
  dialog.addEventListener("click", (e) => {
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
}

// Blob をファイルとして保存する
export function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ログイン前 / 読み込み中 / アプリ本体 のどれかの画面だけを表示する
export function show(screen) {
  for (const id of ["loading", "login", "app"]) $(`#${id}`).hidden = id !== screen;
}

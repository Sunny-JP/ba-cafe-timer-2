// API 呼び出しの共通エラー処理と、再認証 (Drive 連携) の案内。
import { ReauthRequired, preloadGsi, requestDriveCode } from "./auth.js";
import { api } from "./api.js";
import { log } from "./log.js";
import { $, toast } from "../screens/ui.js";

// ログインした直後に Drive が未連携だったときは、バナーを出さずにそのまま Drive の認可画面を開く。
// 開けなかった(ポップアップがブロックされた・閉じられた)ときだけ、従来どおりバナーの「再認証」にする。
export const link = { auto: false };

// 再認証のバナーを出す。Drive の認可画面 (Google Identity Services) は、ここで先に読み込んでおく
export function showReauth() {
  $("#reauth").hidden = false;
  preloadGsi();
}

// fn を実行し、失敗したらトースト or 再認証バナーで知らせて undefined を返す
export async function guarded(fn) {
  try {
    return await fn();
  } catch (e) {
    log.error("guarded", `error: name=${e?.name} status=${e?.status ?? "-"} message=${e?.message} autoLink=${link.auto}`, e);
    if (e instanceof ReauthRequired) {
      if (link.auto) {
        link.auto = false;
        try {
          await api.linkDrive(await requestDriveCode());
          $("#reauth").hidden = true;
          return await guarded(fn);
        } catch {
          /* 下のバナーで再認証してもらう */
        }
      }
      showReauth();
    } else toast(e.message);
    return undefined;
  }
}

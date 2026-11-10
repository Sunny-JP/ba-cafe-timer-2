// 文書 (About / 使い方ガイド / 運営者情報など) の読み込み。
import { getLang, t } from "../features/i18n.js";
import { renderLogList } from "./views.js";

// 文書は js/docs.js に キー→訳 で言語ごとにまとめてある(表示時に初めて読み込む)
let docsModule;
const loadDocs = () => (docsModule ??= import("./docs.js"));
// 変更履歴の印 (<ul class="log" data-update-log>) には js/updates.js の内容を差し込む
const withUpdateLog = (html) => html.replace(/<ul class="log" data-update-log(?:="")?><\/ul>/, () => renderLogList());

export async function loadDoc(id) {
  const { html, translated } = (await loadDocs()).docHtml(id, getLang());
  return (translated ? "" : `<p class="note info">${t("docFallback")}</p>`) + withUpdateLog(html);
}

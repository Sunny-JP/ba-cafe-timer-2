// フォーム入力 (絆の記録・RANK 入力・アクセント色・選択・ファイルの取り込み) のイベント処理。
import { BOND_MAX } from "../../data/gifts.js";
import { log } from "./log.js";
import { DEMO, state } from "./state.js";
import { selectBondChar, submitBond } from "./bond.js";
import { saveProfile } from "./data.js";
import { setAccent } from "../screens/theme.js";
import { importFile } from "./transfer.js";
import { view } from "../screens/ui.js";

export function initForms() {
  view.addEventListener("submit", (e) => {
    e.preventDefault();
    if (DEMO || e.target.dataset.form !== "bond") return;
    return submitBond(e.target);
  });

  // カラーピッカーはドラッグ中に連続して発火するため、メニューは再描画せず色だけ反映する
  document.addEventListener("input", (e) => {
    if (e.target.name === "bond_level") {
      // RANK は 1〜BOND_MAX の整数のみ
      const n = e.target.value.replace(/\D/g, "");
      e.target.value = n === "" ? "" : String(Math.min(BOND_MAX, Math.max(1, Number(n))));
      return;
    }
    if (e.target.dataset.form === "accent") setAccent(e.target.value);
  });

  document.addEventListener("change", async (e) => {
    const kind = e.target.dataset.form;
    if (kind) log.info("change", `data-form="${kind}"`, { value: e.target.type === "file" ? e.target.files?.[0]?.name : e.target.value });
    if (DEMO && kind !== "bond-char") return;
    if (kind === "bond-char") selectBondChar(e.target.value);
    if (kind === "tz") saveProfile({ timezone: e.target.value || null });
    if (kind === "import" && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = "";
      await importFile(file);
    }
  });
}

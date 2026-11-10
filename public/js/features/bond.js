// 絆の記録: キャラの選択・追加・削除。
import { api } from "./api.js";
import { t } from "./i18n.js";
import { log } from "./log.js";
import { state, store } from "./state.js";
import { saveRelCache } from "./cache.js";
import { guarded } from "./guard.js";
import { render } from "../screens/render.js";
import { confirmDialog, withBusy } from "../screens/ui.js";

export function selectBondChar(key) {
  state.bondChar = key;
  state.bondLevel = null;
  store.set("char", key);
  render();
}

// 記録フォームの送信。送信中はボタンを無効にして回転アイコンを出す (再描画すると入力中の値が消えるので、ボタンだけ触る)
export async function submitBond(form) {
  const f = new FormData(form);
  const bond = { char_key: state.bondChar, bond_level: Number(f.get("bond_level")), recorded_at: f.get("recorded_at") };
  const btn = form.querySelector(".record");
  log.info("bond", "addBond: submit", { ...bond, btnDisabled: btn.disabled });
  if (btn.disabled) return;
  btn.disabled = true;
  btn.classList.add("busy");
  let data;
  try {
    data = await guarded(() => api.addBond(bond));
  } finally {
    btn.disabled = false;
    btn.classList.remove("busy");
  }
  log.info("bond", data ? "addBond: success" : "addBond: failed", data?.item);
  if (!data) return;
  state.relationship = [...state.relationship, data.item];
  saveRelCache();
  state.bondLevel = null; // 次の RANK を初期値にする
  state.bondDate = bond.recorded_at;
  render();
}

export async function deleteBond(id) {
  if (!(await confirmDialog(t("confirmDelBond"), t("del"), true))) return;
  const ok = await withBusy(t("deleting"), 1, () => guarded(() => api.deleteBond(id)));
  if (!ok) return;
  state.relationship = state.relationship.filter((x) => x.id !== id);
  saveRelCache();
  state.bondLevel = null;
  render();
}

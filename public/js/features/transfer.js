// データの書き出し (エクスポート) と取り込み (インポート)、アカウントの削除。
import { logout } from "./auth.js";
import { api } from "./api.js";
import { t } from "./i18n.js";
import { guarded } from "./guard.js";
import { loadAll } from "./data.js";
import { toTimerScreen } from "../screens/render.js";
import { busy, confirmDialog, downloadBlob, toast, withBusy } from "../screens/ui.js";

export async function exportData() {
  const data = await withBusy(t("exporting"), 1, () => guarded(() => api.exportData()));
  if (!data) return;
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `cafetimer-export-${new Date().toISOString().slice(0, 10)}.json`);
  toast(t("exported", { taps: data.taps.length, bonds: data.relationship.length }));
}

export async function importFile(file) {
  toTimerScreen();
  busy.show(t("importReading"), 0);
  try {
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return toast(t("badJson"));
    }
    busy.show(t("importSending", { taps: parsed?.taps?.length ?? 0, bonds: parsed?.relationship?.length ?? 0 }), 1);
    const r = await guarded(() => api.importData(parsed));
    if (r) {
      busy.show(t("importRefresh"), 2);
      await loadAll();
      toast(t("imported", { taps: r.taps, bonds: r.relationship, skipped: r.skipped }));
    }
  } finally {
    busy.hide();
  }
}

export async function deleteAccount() {
  if (!(await confirmDialog(t("confirmDelAccount"), t("del"), true))) return;
  toTimerScreen();
  const ok = await withBusy(t("deletingAccount"), 0, () => guarded(() => api.deleteAccount()));
  if (ok) {
    toast(t("deleted"));
    await logout();
  }
}

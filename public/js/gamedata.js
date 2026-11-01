// ゲームデータ(絆EXP表・贈物・キャラ・各言語の名前)の読み込み。
// 本体は public/ に置かず、ログイン後に GET /api/gamedata から取得する。描画の前に一度だけ呼ぶ。
import { api } from './api.js';
import { loadNames, registerStudentNames } from './i18n.js';
import { loadGameData } from '../data/gifts.js';

let loading = null;

export function ensureGameData() {
  loading ??= api.gamedata().then(
    (data) => {
      loadGameData(data);
      loadNames(data.names);
      registerStudentNames(data.catalog.characters);
    },
    (e) => {
      loading = null; // 失敗したら次の呼び出しでやり直す
      throw e;
    },
  );
  return loading;
}

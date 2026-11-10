// 絆EXP表・贈物・キャラ。
// 贈物の画像は img/gifts.png のスプライト (spriteIdx = 左上から右へ数えたコマ番号)。

export const BOND_MAX = 100;

// 絆ランクごとの累計EXP

export const SPRITE = {"cols":5,"width":142,"height":112}; // 1コマの大きさ。画像全体は 710 x 1344

// 好感度の補正倍率 (n: 通常 / s: 高級、b: 中 / a: 大 / s: 特大)
export const GIFT_EXP = {"nb":1,"na":1.5,"ns":2,"sa":1.5,"ss":2};

// 好感度の表示色 (倍率 2.0: 赤 / 1.5: 橙 / 1.0: 青)
export const RATE_COLOR = { 2: '#e5484d', 1.5: '#f5a524', 1: '#3b82f6' };

// ---- ゲームデータ (ログイン後に GET /api/gamedata から読み込む。js/features/gamedata.js) ----
// 参照先を変えずに中身だけ差し替えられるよう、空のまま export しておく。
export const BOND_EXP = {};
export const GIFTS = [];
export const CHARACTERS = [];

export function loadGameData(data) {
  for (const k of Object.keys(BOND_EXP)) delete BOND_EXP[k];
  Object.assign(BOND_EXP, data.bondExp);
  GIFTS.splice(0, GIFTS.length, ...data.gifts);
  CHARACTERS.splice(0, CHARACTERS.length, ...data.characters);
  applyCatalog(data.catalog);
}

export const charName = (key) => CHARACTERS.find((c) => c.key === key)?.name ?? key;

// 管理画面で追加されたキャラクター (Firestore の config/catalog)。静的データの後ろに足す。
// gifts は [GIFTS の番号, 倍率キー] の組。
export function applyCatalog(catalog) {
  for (let i = CHARACTERS.length - 1; i >= 0; i--) if (CHARACTERS[i].extra) CHARACTERS.splice(i, 1);
  for (const c of catalog?.characters ?? []) {
    if (!CHARACTERS.some((x) => x.key === c.key)) CHARACTERS.push({ ...c, extra: true });
  }
}

// 好きな贈物を獲得EXPの高い順に返す
export function favoriteGifts(char) {
  return (char?.gifts ?? [])
    .map(([i, rate]) => {
      const g = GIFTS[i];
      const mult = GIFT_EXP[rate];
      return g && mult ? { ...g, rate, mult, total: g.exp * mult } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.total - a.total || (a.sprite ?? 1e9) - (b.sprite ?? 1e9));
}

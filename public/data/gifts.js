// bondData.ts (絆EXP表・贈物・キャラ) の移植先。
// TODO: 現行の bondData.ts の内容に置き換える。以下は動作確認用のサンプル。

export const BOND_MAX = 100;

export const CHARACTERS = [
  { key: 'arona', name: 'アロナ' },
  { key: 'plana', name: 'プラナ' },
  { key: 'sample1', name: 'サンプル生徒 1' },
  { key: 'sample2', name: 'サンプル生徒 2' },
];

export const charName = (key) => CHARACTERS.find((c) => c.key === key)?.name ?? key;

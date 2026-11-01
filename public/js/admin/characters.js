import { api } from '../api.js';
import { CHARACTERS, GIFTS, GIFT_EXP, RATE_COLOR, SPRITE, applyCatalog, favoriteGifts } from '../../data/gifts.js';
import { studentNames } from '../i18n.js';
import { ensureGameData } from '../gamedata.js';
import { $, esc, initAdminPage, toast } from './common.js';

let catalog = { characters: [] };
const EFFECTS = [null, 'nb', 'na', 'ns', 'sa', 'ss']; // タップで順に切り替える
const EFFECT_LABEL = { nb: '通常・中', na: '通常・大', ns: '通常・特大', sa: '高級・大', ss: '高級・特大' };
const EFFECT_SHORT = { nb: '通中', na: '通大', ns: '通特', sa: '高大', ss: '高特' };
const picked = new Map(); // GIFTS の番号 -> 効果キー

async function save(next, okMsg) {
  try {
    catalog = await api.adminSaveCatalog(next);
    applyCatalog(catalog);
    renderCatalog();
    toast(okMsg);
    return true;
  } catch (e) {
    toast(e.message);
    return false;
  }
}

const spriteStyle = (g) =>
  `--x:${(g.sprite % SPRITE.cols) * SPRITE.width};--y:${Math.floor(g.sprite / SPRITE.cols) * SPRITE.height}`;

// 全キャラの設定(組み込み + 管理画面で追加したもの)。削除できるのは追加したものだけ
function renderCatalog() {
  const q = $('#char-filter').value.trim().toLowerCase();
  const rows = CHARACTERS.map((c) => ({ c, names: c.extra ? { ...c.names } : studentNames(c.name) }))
    .filter(({ c, names }) => !q || [c.key, c.name, names.en, names.zh, names.ko].some((s) => s?.toLowerCase().includes(q)));

  $('#char-count').textContent = `${rows.length} / ${CHARACTERS.length} 件 (追加分 ${catalog.characters.length} 件)`;
  $('#char-list').innerHTML =
    rows
      .map(({ c, names }) => {
        const nameText = [['ja', c.name], ['en', names.en], ['zh', names.zh], ['ko', names.ko]]
          .map(([l, n]) => `${l}: ${n ? esc(n) : '-'}`)
          .join(' / ');
        // 1行目: key (+バッジ) / 2行目: 各言語の名前
        const gifts = favoriteGifts(c)
          .map(
            (g) => `<span class="pick mini" data-rate="${g.rate}" style="--rate:${RATE_COLOR[g.mult]}" title="${esc(g.name)} (${EFFECT_LABEL[g.rate]})">
              <span class="gift-img" style="${spriteStyle(g)}"></span><span class="eff">${EFFECT_SHORT[g.rate]}</span></span>`,
          )
          .join('');
        return `<li><div class="charhead"><span class="charname"><b>${esc(c.key)}</b>${c.extra ? ' <span class="badge">追加</span>' : ''}<span class="note">${nameText}</span></span>
          ${c.extra ? `<button class="ghost danger" data-del-char="${esc(c.key)}">削除</button>` : ''}</div>
          <div class="minis">${gifts || '<span class="note">好きな贈り物なし</span>'}</div></li>`;
      })
      .join('') || '<li class="note">該当するキャラクターがありません</li>';
}

function renderPicker() {
  $('#picker').innerHTML = GIFTS.map((g, i) => {
    const rate = picked.get(i);
    const color = rate ? RATE_COLOR[GIFT_EXP[rate]] : '';
    return `<button type="button" class="pick" data-gift="${i}" title="${esc(g.name)}" ${rate ? `data-rate="${rate}"` : ''} style="--rate:${color}">
      <i class="dot"></i><span class="gift-img" style="${spriteStyle(g)}"></span>
      <span class="eff">${rate ? EFFECT_SHORT[rate] : ''}</span></button>`;
  }).join('');
  $('#picked-count').textContent = `${picked.size} 件選択中`;
}

$('#char-filter').oninput = renderCatalog;

$('#char-form').onsubmit = async (e) => {
  e.preventDefault();
  if (!picked.size) return toast('好きな贈り物を1つ以上選んでください');
  const f = new FormData(e.target);
  const names = Object.fromEntries(['en', 'zh', 'ko'].map((l) => [l, f.get(l).trim()]).filter(([, v]) => v));
  const char = { key: f.get('key').trim(), name: f.get('name').trim(), names, gifts: [...picked] };
  if (await save({ characters: [...catalog.characters, char] }, 'キャラクターを追加しました')) {
    picked.clear();
    e.target.reset();
    renderPicker();
  }
};

document.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.gift) {
    const i = Number(b.dataset.gift);
    const next = EFFECTS[(EFFECTS.indexOf(picked.get(i) ?? null) + 1) % EFFECTS.length];
    if (next) picked.set(i, next);
    else picked.delete(i);
    renderPicker();
  } else if (b.dataset.delChar) {
    if (!confirm('このキャラクターを削除しますか?(ユーザーの絆データは消えません)')) return;
    await save({ characters: catalog.characters.filter((c) => c.key !== b.dataset.delChar) }, '削除しました');
  }
});

initAdminPage('/admin/characters', async () => {
  try {
    await ensureGameData(); // キャラ・贈物はログイン後にサーバーから取得する
    catalog = await api.catalog();
    applyCatalog(catalog);
  } catch (e) {
    toast(e.message);
  }
  renderCatalog();
  renderPicker();
});

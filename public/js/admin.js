// 管理画面 (/admin/*)。各ページの <body data-page="…"> で処理を選ぶ。権限の判定はサーバー (ADMIN_UIDS) が行う
import { api, login, logout, onUser, setVerbose } from "./api.js";
import { CHARACTERS, GIFTS, GIFT_EXP, RATE_COLOR, SPRITE, applyCatalog, ensureGameData, favoriteGifts } from "./gamedata.js";
import { studentNames } from "./i18n.js";
import { showForegroundNotifications } from "./push.js";
import { esc } from "./views.js";

const $ = (selector) => document.querySelector(selector);

let toastTimer = 0;
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (element.hidden = true), 3500);
}

const PAGES = [
  ["push", "/admin/push", "通知"],
  ["stats", "/admin/stats", "統計"],
  ["taptest", "/admin/taptest", "タップテスト"],
  ["characters", "/admin/characters", "キャラクター追加"],
];

// 結果欄に出す (失敗は赤字)
async function showResult(output, busyText, operation) {
  output.className = "result";
  output.textContent = busyText;
  try {
    output.textContent = await operation();
  } catch (error) {
    output.className = "result err";
    output.textContent = error.message;
  }
}

// ---- 通知 ----

function initPushPage() {
  $("#test-push").onclick = () =>
    showResult($("#push-result"), "送信中…", async () => {
      const result = await api.adminTestPush();
      const reasons = result.failures.length ? `\n理由: ${[...new Set(result.failures)].join(", ")}` : "";
      return `端末 ${result.devices} 台 / 成功 ${result.ok} / 無効 ${result.gone} (登録解除) / 失敗 ${result.error}${reasons}`;
    });
  return showForegroundNotifications;
}

// ---- タップテスト ----

function initTapTestPage() {
  const formatJst = (iso) => new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
  const runTest = (schedule, output) =>
    showResult(output, "実行中…", async () => {
      const tapTime = $("#tap-time").value;
      const result = await api.adminTestTap({ schedule, tap_time: tapTime ? new Date(tapTime).toISOString() : undefined });
      const lines = schedule
        ? [`予約しました: ${formatJst(result.queued)} (JST) に通知が届きます`, `通知オンの端末: ${result.devices} 台(すべてに届きます)`]
        : [
            `タップ時刻: ${formatJst(result.tap_time)} (JST)`,
            `論理月: ${result.logical_month}`,
            `統計キー: ${result.stats_keys.join(", ")}`,
            result.notification.scheduled ? `通知: ${formatJst(result.notification.send_at)} に予約される` : `通知: 予約されない (${result.notification.reason})`,
            `サービスアカウント: ${result.service_account ? "設定済み" : "未設定 (通知は予約されません)"}`,
            `通知オンの端末: ${result.devices} 台`,
          ];
      return lines.join("\n");
    });
  $("#run").onclick = () => runTest(false, $("#sim-result"));
  $("#queue").onclick = () => runTest(true, $("#queue-result"));
  return showForegroundNotifications;
}

// ---- 統計 ----

const formatNumber = (value) => (value == null ? "-" : Number(value).toLocaleString());
const percent = (value, max) => (max ? Math.max(0, (value / max) * 100) : 0);
const sum = (values) => values.reduce((total, value) => total + value, 0);
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 縦棒グラフ。最大の棒だけ濃くする。labels は軸ラベル (空文字は非表示)
function verticalBars(container, axis, values, titles, labels) {
  const max = Math.max(1, ...values);
  const peak = values.indexOf(Math.max(...values));
  container.innerHTML = values
    .map(
      (value, index) =>
        `<div class="col${value > 0 && index === peak ? " peak" : ""}" data-tip="${esc(titles[index])}: ${formatNumber(value)}"><div class="bar" style="height:${percent(value, max)}%"></div></div>`,
    )
    .join("");
  axis.innerHTML = labels.map((label) => `<span>${label}</span>`).join("");
}

function renderStats(stats) {
  const last30Days = sum(stats.daily.map((day) => day.count));
  const pushRate = stats.users ? Math.round((stats.pushUsers / stats.users) * 100) : null;
  const tapsPerUser = stats.users ? stats.totalTaps / stats.users : null;
  const cards = [
    ["登録ユーザー数", formatNumber(stats.users), ""],
    ["通知オン", formatNumber(stats.pushUsers), pushRate === null ? "" : `ユーザーの ${pushRate}%`],
    ["累計タップ数", formatNumber(stats.totalTaps), tapsPerUser === null ? "" : `1人あたり ${tapsPerUser.toFixed(1)} 回`],
    ["直近30日のタップ", formatNumber(last30Days), `1日平均 ${(last30Days / Math.max(1, stats.daily.length)).toFixed(1)} 回`],
  ];
  $("#cards").innerHTML = cards.map(([label, value, note]) => `<div class="kpi"><span>${label}</span><b>${value}</b><small>${note || "&nbsp;"}</small></div>`).join("");

  const peakHour = stats.hourly.indexOf(Math.max(...stats.hourly));
  verticalBars($("#hourly"), $("#hourly-axis"), stats.hourly, stats.hourly.map((_, hour) => `${hour}時台`), stats.hourly.map((_, hour) => (hour % 3 === 0 ? hour : "")));
  $("#hourly-sub").textContent = sum(stats.hourly) ? `最も多いのは ${peakHour}時台` : "まだデータがありません (集計開始後のタップが対象です)";
  const peakWeekday = stats.weekly.indexOf(Math.max(...stats.weekly));
  verticalBars($("#weekly"), $("#weekly-axis"), stats.weekly, WEEKDAYS.map((weekday) => `${weekday}曜`), WEEKDAYS);
  $("#weekly-sub").textContent = sum(stats.weekly) ? `最も多いのは ${WEEKDAYS[peakWeekday]}曜日` : "まだデータがありません";

  // 到達人数のヒートマップ付きランキング (並びはサーバーで済み)。枠は下限で持つ: 100 / 99～95 / 94～90 …
  const thresholds = stats.thresholds;
  const rangeLabel = (index) => (index === 0 ? `${thresholds[0]}` : `${thresholds[index - 1] - 1}～${thresholds[index]}`);
  const max = Math.max(1, ...stats.bonds.flatMap((bond) => thresholds.map((threshold) => bond.reached[threshold])));
  const header = `<div class="hd"><span></span><span style="text-align:left">キャラ</span><span>登録</span>${thresholds.map((_, index) => `<span>${rangeLabel(index)}</span>`).join("")}</div>`;
  const rows = stats.bonds.map((bond, rank) => {
    const cells = thresholds
      .map((threshold, index) => {
        const reached = bond.reached[threshold];
        return `<span class="c${reached ? "" : " z"}" style="--k:${(reached / max).toFixed(3)}" title="${esc(bond.name)} ${rangeLabel(index)}: ${formatNumber(reached)}人">${formatNumber(reached)}</span>`;
      })
      .join("");
    return `<div class="rw"><span class="no">${rank + 1}</span><span class="nm" title="${esc(bond.name)}">${esc(bond.name)}</span><span class="reg">${formatNumber(bond.records)}</span>${cells}</div>`;
  });
  $("#bonds").innerHTML = rows.length ? header + rows.join("") : '<p class="note">まだ記録がありません。</p>';
}

// data-tip を持つ要素にホバー・タップしたとき、すぐに出るツールチップ
function initTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "tip";
  tooltip.hidden = true;
  document.body.append(tooltip);
  document.addEventListener("pointermove", (event) => {
    const target = event.target.closest?.("[data-tip]");
    tooltip.hidden = !target;
    if (!target) return;
    tooltip.textContent = target.dataset.tip;
    tooltip.style.left = `${Math.min(event.clientX + 12, innerWidth - tooltip.offsetWidth - 8)}px`;
    const above = event.clientY - tooltip.offsetHeight - 12;
    tooltip.style.top = `${above < 0 ? event.clientY + 16 : above}px`;
  });
  document.addEventListener("pointerleave", () => (tooltip.hidden = true));
}

function initStatsPage() {
  initTooltip();
  return () => api.adminStats().then(renderStats, (error) => toast(error.message));
}

// ---- キャラクター追加 ----

function initCharactersPage() {
  let catalog = { characters: [] };
  const EFFECTS = [null, "nb", "na", "ns", "sa", "ss"]; // タップするたびに順に切り替える
  const EFFECT_LABELS = { nb: "通常・中", na: "通常・大", ns: "通常・特大", sa: "高級・大", ss: "高級・特大" };
  const EFFECT_SHORT_LABELS = { nb: "通中", na: "通大", ns: "通特", sa: "高大", ss: "高特" };
  const pickedGifts = new Map(); // GIFTS の番号 -> 効果
  const spriteStyle = (gift) => `--x:${(gift.sprite % SPRITE.cols) * SPRITE.width};--y:${Math.floor(gift.sprite / SPRITE.cols) * SPRITE.height}`;

  function renderCatalog() {
    const query = $("#char-filter").value.trim().toLowerCase();
    const rows = CHARACTERS.map((character) => ({ character, names: character.extra ? { ...character.names } : studentNames(character.name) })).filter(
      ({ character, names }) => !query || [character.key, character.name, names.en, names.zh, names.ko].some((name) => name?.toLowerCase().includes(query)),
    );
    $("#char-count").textContent = `${rows.length} / ${CHARACTERS.length} 件 (追加分 ${catalog.characters.length} 件)`;
    $("#char-list").innerHTML =
      rows
        .map(({ character, names }) => {
          const nameText = [["ja", character.name], ["en", names.en], ["zh", names.zh], ["ko", names.ko]].map(([lang, name]) => `${lang}: ${name ? esc(name) : "-"}`).join(" / ");
          const gifts = favoriteGifts(character)
            .map(
              (gift) => `<span class="pick mini" data-rate="${gift.rate}" style="--rate:${RATE_COLOR[gift.mult]}" title="${esc(gift.name)} (${EFFECT_LABELS[gift.rate]})">
                <span class="gift-img" style="${spriteStyle(gift)}"></span><span class="eff">${EFFECT_SHORT_LABELS[gift.rate]}</span></span>`,
            )
            .join("");
          const badge = character.extra ? ' <span class="badge">追加</span>' : "";
          const deleteButton = character.extra ? `<button class="ghost danger" data-del-char="${esc(character.key)}">削除</button>` : "";
          return `<li><div class="charhead"><span class="charname"><b>${esc(character.key)}</b>${badge}<span class="note">${nameText}</span></span>${deleteButton}</div>
            <div class="minis">${gifts || '<span class="note">好きな贈り物なし</span>'}</div></li>`;
        })
        .join("") || '<li class="note">該当するキャラクターがありません</li>';
  }

  function renderGiftPicker() {
    $("#picker").innerHTML = GIFTS.map((gift, index) => {
      const rate = pickedGifts.get(index);
      return `<button type="button" class="pick" data-gift="${index}" title="${esc(gift.name)}" ${rate ? `data-rate="${rate}"` : ""} style="--rate:${rate ? RATE_COLOR[GIFT_EXP[rate]] : ""}">
        <i class="dot"></i><span class="gift-img" style="${spriteStyle(gift)}"></span>
        <span class="eff">${rate ? EFFECT_SHORT_LABELS[rate] : ""}</span></button>`;
    }).join("");
    $("#picked-count").textContent = `${pickedGifts.size} 件選択中`;
  }

  async function saveCatalog(next, successMessage) {
    try {
      catalog = await api.adminSaveCatalog(next);
      applyCatalog(catalog);
      renderCatalog();
      toast(successMessage);
      return true;
    } catch (error) {
      toast(error.message);
      return false;
    }
  }

  $("#char-filter").oninput = renderCatalog;
  $("#char-form").onsubmit = async (event) => {
    event.preventDefault();
    if (!pickedGifts.size) return toast("好きな贈り物を1つ以上選んでください");
    const fields = new FormData(event.target);
    const names = Object.fromEntries(["en", "zh", "ko"].map((lang) => [lang, fields.get(lang).trim()]).filter(([, name]) => name));
    const character = { key: fields.get("key").trim(), name: fields.get("name").trim(), names, gifts: [...pickedGifts] };
    if (await saveCatalog({ characters: [...catalog.characters, character] }, "キャラクターを追加しました")) {
      pickedGifts.clear();
      event.target.reset();
      renderGiftPicker();
    }
  };
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (button?.dataset.gift) {
      const giftIndex = Number(button.dataset.gift);
      const nextEffect = EFFECTS[(EFFECTS.indexOf(pickedGifts.get(giftIndex) ?? null) + 1) % EFFECTS.length];
      if (nextEffect) pickedGifts.set(giftIndex, nextEffect);
      else pickedGifts.delete(giftIndex);
      renderGiftPicker();
    } else if (button?.dataset.delChar && confirm("このキャラクターを削除しますか?(ユーザーの絆データは消えません)")) {
      await saveCatalog({ characters: catalog.characters.filter((character) => character.key !== button.dataset.delChar) }, "削除しました");
    }
  });

  return async () => {
    try {
      await ensureGameData({ fresh: true });
      catalog = await api.catalog();
      applyCatalog(catalog);
    } catch (error) {
      toast(error.message);
    }
    renderCatalog();
    renderGiftPicker();
  };
}

// ---- 共通: ナビ・ログイン・管理者の確認 (管理者でなければアプリへ戻す) ----

const PAGE_SETUP = { push: initPushPage, taptest: initTapTestPage, stats: initStatsPage, characters: initCharactersPage };
const page = document.body.dataset.page;
const onReady = PAGE_SETUP[page]?.() ?? (() => {});

$("#shell").innerHTML = `
  <div class="row" style="justify-content: space-between">
    <h1><a href="/admin/" style="text-decoration:none;color:inherit">Cafe Timer 2 管理</a></h1>
    <span><a href="/">アプリへ</a> <button id="logout-btn" class="ghost">ログアウト</button></span>
  </div>
  <nav class="adminnav">${PAGES.map(([id, href, label]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
  <p id="denied" class="err" hidden></p>`;
$("#login-btn").onclick = () => login().catch((error) => toast(error.message));
$("#logout-btn").onclick = () => logout();

onUser(async (user) => {
  $("#login").hidden = !!user;
  $("#admin").hidden = true;
  if (!user) return;
  try {
    await api.adminMe();
  } catch (error) {
    if (error.status === 403) return location.replace("/");
    $("#admin").hidden = false;
    $("#denied").hidden = false;
    $("#denied").textContent = error.message;
    $("#content").hidden = true;
    return;
  }
  setVerbose(true);
  $("#admin").hidden = false;
  $("#content").hidden = false;
  onReady(user);
});

import { BOND_MAX, CHARACTERS, RATE_COLOR, favoriteGifts, spritePosition } from "./gamedata.js";
import { LANGS, categoryName, getLang, giftName, studentName, studentNames, t } from "./i18n.js";
import { CAL_MIN, MODES } from "./state.js";
import { TICKET_COOLDOWN, daySlots, daysInMonth, fmt, fmtTime, leadingBlanks, logicalDay, logicalMonth, nextTapTime, padTwo, prevMonth } from "./time.js";
import { UPDATE_LOGS } from "./updates.js";

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const ICONS = {
  menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  sun: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z",
  moon: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
  timer: "M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0 0 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a8.994 8.994 0 0 0 7.03-14.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z",
  calendar: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z",
  heart: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  book: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",
  help: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
  file: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
  person: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  history: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
  chevron: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z",
  dropdown: "M7 10l5 5 5-5z",
  settings: "M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z",
};

export const icon = (name, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

const spinner = '<span class="btn-spin" role="status" aria-label="Loading"></span>';
const capitalize = (text) => text[0].toUpperCase() + text.slice(1);

const countdown = (until) => `<span class="count" data-until="${until}"></span>`;

export function tick(root, now = Date.now()) {
  for (const element of root.querySelectorAll("[data-until]")) {
    const seconds = Math.max(0, Math.ceil((Number(element.dataset.until) - now) / 1000));
    element.textContent = `${padTwo(Math.floor(seconds / 3600))}:${padTwo(Math.floor(seconds / 60) % 60)}:${padTwo(seconds % 60)}`;
  }
  for (const button of root.querySelectorAll("[data-enable-at]")) button.disabled = "pending" in button.dataset || Number(button.dataset.enableAt) > now;
}

const actionButton = (state, pendingKey, attributes, label) => {
  const waiting = state.pending.has(pendingKey) || state.syncing;
  return `<button class="primary wide" ${attributes}${waiting ? " data-pending" : ""}>${waiting ? spinner : label}</button>`;
};

export function renderTimer(state, now = Date.now()) {
  const timeZone = state.profile.timezone;
  const nextTap = state.lastTap ? nextTapTime(Date.parse(state.lastTap.tap_time)) : 0;
  const slots = daySlots(now, state.monthTaps)
    .map((slot) => `<li class="slot${slot.tap ? " on" : ""}">${fmtTime(slot.tap ?? slot.time, timeZone)}</li>`)
    .join("");
  const tickets = [1, 2]
    .map((number) => {
      const usedAt = state.profile[`ticket${number}_time`];
      const readyAt = usedAt ? Date.parse(usedAt) + TICKET_COOLDOWN : 0;
      return `<div>
        <p class="timer indent">${countdown(readyAt)}</p>
        ${actionButton(state, `ticket${number}`, `data-act="ticket-use" data-n="${number}" data-enable-at="${readyAt}"`, `Ticket ${number}`)}
      </div>`;
    })
    .join("");
  return `
    <section class="block">
      <h2 class="label">Next Tap</h2>
      <p class="big indent">${countdown(nextTap)}</p>
      <ul class="slots">${slots}</ul>
      ${actionButton(state, "tap", `data-act="tap" data-enable-at="${nextTap}"`, "Tap")}
    </section>
    <section class="block">
      <h2 class="label">Next Call</h2>
      <div class="grid2">${tickets}</div>
    </section>`;
}

export function renderAds(state) {
  if (!state.ads?.length) return "";
  const cards = state.ads
    .map(
      (item) => `<li><a href="${esc(item.url)}" target="_blank" rel="sponsored noopener noreferrer">
        <img src="${esc(item.image)}" alt="" loading="lazy" decoding="async">
        <span class="ads-name">${esc(item.name)}</span>
        <span class="ads-price">¥${Number(item.price).toLocaleString("ja-JP")}</span>
      </a></li>`,
    )
    .join("");
  return `<p class="ads-label">PR｜${esc(t("rakutenIchiba"))}</p><ul class="ads-list">${cards}</ul>`;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const heatLevel = (count) => Math.min(8, count);

export function dayCounts(taps) {
  const counts = {};
  for (const tap of taps) {
    const day = logicalDay(Date.parse(tap.tap_time));
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}

function monthPicker(month, latestMonth) {
  const options = [];
  for (let option = latestMonth; option >= CAL_MIN; option = prevMonth(option)) options.push([option, option.replace("-", ". ").replace(/\. 0/, ". ")]);
  return dropdown({ field: "cal-ym", value: month, large: true, options });
}

export function calendarBody(state) {
  const { calMonth: month, calTaps: taps, selectedDay, calLoading } = state;
  const latestMonth = logicalMonth(Date.now());
  const counts = dayCounts(taps);
  const cells = Array(leadingBlanks(month)).fill("<div></div>");
  for (let date = 1; date <= daysInMonth(month); date++) {
    const day = `${month}-${padTwo(date)}`;
    const count = counts[day] ?? 0;
    const level = heatLevel(count);
    const classes = `day${level >= 5 ? " hi" : ""}${level >= 7 ? " top" : ""}${day === selectedDay ? " sel" : ""}`;
    cells.push(`<button class="${classes}" style="--lv:${level}" data-act="day" data-day="${day}"><span>${date}</span>${count ? `<b>${count}</b>` : ""}</button>`);
  }
  const selectedTaps = selectedDay
    ? taps.filter((tap) => logicalDay(Date.parse(tap.tap_time)) === selectedDay).sort((first, second) => (first.tap_time < second.tap_time ? -1 : 1))
    : [];
  const selectedList = selectedTaps.map((tap) => `<li>${fmtTime(Date.parse(tap.tap_time), state.profile.timezone)}</li>`).join("") || `<li class="sub">${t("noRecord")}</li>`;
  return `
    <section class="block">
      <div class="cal-head">
        <button class="ghost" data-act="cal-prev" ${month <= CAL_MIN ? "disabled" : ""}>Prev</button>
        <div>
          <h2 class="cal-title">${monthPicker(month, latestMonth)}</h2>
          <button class="ghost small" data-act="save-image">SAVE IMAGE</button>
          <button class="ghost small" data-act="cal-today" ${month === latestMonth ? "disabled" : ""}>${t("thisMonth")}</button>
        </div>
        <button class="ghost" data-act="cal-next" ${month >= latestMonth ? "disabled" : ""}>Next</button>
      </div>
      <div class="cal${calLoading ? " loading" : ""}">${WEEKDAYS.map((weekday) => `<em>${weekday}</em>`).join("")}${cells.join("")}</div>
    </section>
    ${selectedDay ? `<section class="block"><h2 class="label">${selectedDay} (${selectedTaps.length})</h2><ul class="plain taps-row">${selectedList}</ul></section>` : ""}`;
}

export const renderCalendar = (state) => `<div id="cal-area">${calendarBody(state)}</div>`;

const optionIcon = (src) => (src ? `<img class="dd-icon" src="${esc(src)}" alt="" loading="lazy" decoding="async">` : "");
const optionText = (text) => {
  const match = /^(.*?)\s*([（(].*)$/.exec(text);
  return match ? `${esc(match[1])} <span class="paren">${esc(match[2])}</span>` : esc(text);
};
const optionLabel = (label) => (Array.isArray(label) ? `<span class="l1">${esc(label[0])}</span><span class="l2">${esc(label[1])}</span>` : optionText(label));

function dropdown({ field, value, options, large = false, search = false }) {
  const current = options.find(([optionValue]) => optionValue === value) ?? options[0];
  const items = options
    .map(
      ([optionValue, label, image, searchText]) =>
        `<li${searchText ? ` data-q="${esc(searchText)}"` : ""}><button type="button" role="option" aria-selected="${optionValue === current[0]}" data-act="dd-pick" data-field="${field}" data-value="${esc(optionValue)}">${optionIcon(image)}${optionLabel(label)}</button></li>`,
    )
    .join("");
  return `<div class="dd${large ? " lg" : ""}">
    <button type="button" class="dd-btn" data-act="dd-toggle" aria-haspopup="listbox" aria-expanded="false">
      <span>${large ? "" : optionIcon(current[2])}${optionLabel(current[1])}</span>${icon("dropdown", large ? 28 : 18)}
    </button>
    <ul class="dd-list" role="listbox">
      ${search ? '<li class="dd-search"><input type="search" class="dd-q" placeholder="Search" autocomplete="off" aria-label="Search"></li>' : ""}
      ${items}
    </ul>
  </div>`;
}

export const langPicker = (value) => dropdown({ field: "lang", value, options: LANGS });

const localized = (text) => (typeof text === "string" ? text : (text?.[getLang()] ?? text?.ja ?? ""));
const logHeading = (entry) => entry.date ?? localized(entry.label);

export const renderLogList = () =>
  `<ul class="log">${UPDATE_LOGS.map((entry) => {
    const comment = localized(entry.comment);
    const content = esc(localized(entry.content));
    return `<li><span>${esc(logHeading(entry))}</span>${comment ? `<div>${content}<small class="sub">${esc(comment)}</small></div>` : content}</li>`;
  }).join("")}</ul>`;

export const noticeBanner = (latest) => `<button class="notice" data-act="notice-open">
    <span class="notice-head"><b>${esc(t("noticeLabel"))}</b><time>${esc(logHeading(latest))}</time></span>
    <span class="notice-title">${esc(localized(latest.content))}</span>
    ${icon("chevron", 20)}
  </button>`;

export const skeleton = () => `<div class="skeleton" role="status" aria-busy="true" aria-label="${esc(t("loading"))}">
  <section class="block"><div class="sk sk-label"></div><div class="sk sk-big"></div>
    <ul class="slots">${'<li class="slot sk"></li>'.repeat(8)}</ul><div class="sk sk-btn"></div></section>
  <section class="block"><div class="sk sk-label"></div>
    <div class="grid2"><div class="sk sk-timer"></div><div class="sk sk-timer"></div></div>
    <div class="grid2"><div class="sk sk-btn"></div><div class="sk sk-btn"></div></div></section>
</div>`;

const loader = () => `<div class="center loader" role="status"><span class="spinner" aria-hidden="true"></span><p>${t("loading")}</p></div>`;

export const bondRecords = (state, charKey) => state.relationship.filter((item) => item.char_key === charKey).sort((first, second) => second.bond_level - first.bond_level);
const nextBondLevel = (state, charKey) => Math.min(BOND_MAX, (bondRecords(state, charKey)[0]?.bond_level ?? 0) + 1);
const charIcon = (charKey) => `/img/students/${encodeURIComponent(charKey)}.webp`;

function charOptions() {
  const lang = getLang();
  const options = CHARACTERS.map((character) => [
    character.key,
    studentName(character.name),
    undefined,
    [character.name, ...Object.values(studentNames(character.name))].join(" "),
  ]);
  return lang === "ja" ? options : options.sort((first, second) => first[1].localeCompare(second[1], lang));
}

export function renderBond(state) {
  if (!state.bondReady) return loader();
  const charKey = state.bondChar;
  const character = CHARACTERS.find((candidate) => candidate.key === charKey);
  const level = state.bondLevel ?? nextBondLevel(state, charKey);
  const date = state.bondDate ?? fmt(Date.now(), { year: "numeric", month: "2-digit", day: "2-digit" }, state.profile.timezone).replace(/\//g, "-");
  const gifts = favoriteGifts(character)
    .map(
      (gift) => `<li class="gift" title="${esc(giftName(gift.name))}">
        <i class="dot" style="background:${RATE_COLOR[gift.mult]}"></i>
        <span class="gift-img" style="${spritePosition(gift)}"></span>
        <span class="gift-cat">${esc(categoryName(gift.category))}</span></li>`,
    )
    .join("");
  const history = bondRecords(state, charKey)
    .slice(0, 4)
    .map(
      (item) => `<li><strong>${item.bond_level}</strong><span class="sep">|</span><span>${esc(item.recorded_at)}</span>
        <button class="ghost icon sm" data-act="bond-del" data-id="${esc(item.id)}" aria-label="${t("del")}">${icon("trash", 16)}</button></li>`,
    )
    .join("");
  return `<div class="cols bond-cols">
    <div>
    <form data-form="bond" class="block">
      <div class="bond-head">
        <img class="bond-icon" src="${esc(charIcon(charKey))}" alt="" decoding="async">
        <div class="bond-fields">
          ${dropdown({ field: "char", value: charKey, large: true, search: true, options: charOptions() })}
          <div class="bond-row">
            <label>Rank <input name="bond_level" type="number" inputmode="numeric" min="1" max="${BOND_MAX}" value="${level}" required></label>
            <label>Date <input name="recorded_at" type="date" value="${esc(date)}" required></label>
            <button class="primary record${state.syncing ? " busy" : ""}" aria-label="Record"${state.syncing ? " disabled" : ""}>+</button>
          </div>
        </div>
      </div>
    </form>
    <section class="block">
      <h2 class="label">Favorite Gifts</h2>
      <div class="gifts-wrap">
        <ul class="gifts">${gifts || `<li class="sub">${t("noData")}</li>`}</ul>
        <button class="gifts-nav prev" data-act="gifts-scroll" data-dir="-1" aria-label="${t("prev")}">${icon("chevron")}</button>
        <button class="gifts-nav next" data-act="gifts-scroll" data-dir="1" aria-label="${t("next")}">${icon("chevron")}</button>
      </div>
    </section>
    <section class="block">
      <h2 class="label">History Log</h2>
      <ul class="history">${history || `<li class="sub">${t("noHistory")}</li>`}</ul>
    </section>
    </div>
    <div>
    <section class="block">
      <h2 class="label">Progress Graph</h2>
      <div class="chart"><canvas id="chart"></canvas></div>
    </section>
    </div>
  </div>`;
}

const DOCS = ["about", "guide", "faq", "changelog", "terms", "privacy", "operator"];
const DOC_ICONS = { about: "info", guide: "book", faq: "help", terms: "file", privacy: "shield", changelog: "history", operator: "person" };

export function renderMenu(state) {
  const user = state.user ?? {};
  const name = user.displayName || user.email || "";
  return `
    <div class="menu-head">
      <span class="avatar">${esc([...name][0] ?? "")}${user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : ""}</span>
      <span class="who"><strong>${esc(name)}</strong>${user.displayName ? `<small>${esc(user.email ?? "")}</small>` : ""}</span>
    </div>
    <div class="menu-list">
      ${DOCS.map((id) => `<button class="menu-item" data-act="doc" data-doc="${id}">${icon(DOC_ICONS[id])}${esc(t(`doc${capitalize(id)}`))}</button>`).join("")}
    </div>
    <hr>
    <div class="menu-list">
      <button class="menu-item" data-act="settings">${icon("settings")}${t("settings")}</button>
    </div>`;
}

export const renderDoc = (state) => `<section class="block doc">${state.docHtml ?? ""}</section>`;

function zoneOffset(timeZone, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "longOffset" }).formatToParts(at);
    const match = (parts.find((part) => part.type === "timeZoneName")?.value ?? "").match(/([+-])(\d{2}):(\d{2})/);
    if (match) return { minutes: (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])), text: `${match[1]}${match[2]}:${match[3]}` };
  } catch {}
  return { minutes: 0, text: "+00:00" };
}

const zoneOptions = (timeZones) =>
  timeZones
    .map((timeZone) => ({ timeZone, ...zoneOffset(timeZone) }))
    .sort((first, second) => first.minutes - second.minutes || first.timeZone.localeCompare(second.timeZone))
    .map(({ timeZone, text }) => [timeZone, [timeZone, `UTC${text}`]]);

export function renderSettings(state) {
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZones = [["", [t("deviceZone"), `${deviceZone} · UTC${zoneOffset(deviceZone).text}`]], ...zoneOptions(Intl.supportedValuesOf?.("timeZone") ?? [])];
  const pushBusy = state.pending.has("push");
  const pushLabel = pushBusy
    ? `<span class="menu-text">${spinner}</span>`
    : `<span class="menu-text">${t(state.pushOn ? "pushTurnOff" : "pushTurnOn")}<small>${t(state.pushOn ? "pushStateOn" : "pushStateOff")}</small></span>`;
  return `
    <section class="block settings">
      <h2 class="label">${t("settings")}</h2>
      <h3 class="menu-title">${t("display")}</h3>
      <div class="seg">
        ${MODES.map((mode) => `<button data-act="mode" data-mode="${mode}" aria-pressed="${state.mode === mode}">${t(`mode${capitalize(mode)}`)}</button>`).join("")}
      </div>
      <label class="accent">${t("accent")}
        <span class="row">
          <input type="color" data-form="accent" value="${esc(state.accent)}">
          <button class="ghost" data-act="accent-reset">${t("reset")}</button>
        </span>
      </label>
      <div class="field">${t("timezone")}${dropdown({ field: "tz", value: state.profile.timezone ?? "", options: timeZones })}</div>
      <div class="field">${t("language")}${dropdown({ field: "lang", value: getLang(), options: LANGS })}</div>
      <hr>
      <h3 class="menu-title">${t("notifData")}</h3>
      <div class="menu-list">
        <button class="menu-item" data-act="push" ${state.pushSupported && !pushBusy ? "" : "disabled"}>${icon("bell")}${pushLabel}</button>
        ${state.pushSupported ? "" : `<p class="sub hint">${t("pushUnsupported")}</p>`}
        <label class="menu-item" role="button" tabindex="0">${icon("upload")}${t("importOld")}<input type="file" accept="application/json" data-form="import" hidden></label>
        <button class="menu-item" data-act="export-data" ${state.pending.has("export-data") ? "disabled" : ""}>${icon("download")}${t("exportData")}</button>
        <button class="menu-item danger" data-act="delete-account">${icon("trash")}${t("deleteData")}</button>
        <button class="menu-item" data-act="logout">${icon("logout")}${t("logout")}</button>
      </div>
    </section>`;
}

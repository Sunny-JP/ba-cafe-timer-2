import { api, log, login, onUser, preloadGsi, requestDriveCode } from "./api.js";
import { saveCalendarImage } from "./chart.js";
import {
  clearCalendarCache,
  deleteAccount,
  deleteBond,
  exportData,
  guarded,
  importFile,
  link,
  loadAds,
  loadAll,
  loadCalendar,
  loadDeferred,
  logoutDevice,
  reloadWaitMs,
  primeBond,
  recordTap,
  refresh,
  saveProfile,
  selectBondChar,
  selectDay,
  submitBond,
  withPending,
} from "./data.js";
import { BOND_MAX, clearGameDataCache } from "./gamedata.js";
import { applyStatic, getLang, setLang, t } from "./i18n.js";
import { clearWorkerOutbox, flush, initOutbox } from "./outbox.js";
import { disablePush, enablePush, pushEnabled, registerWorker, showForegroundNotifications } from "./push.js";
import { TICKET_COOLDOWN, logicalMonth, nextMonth, prevMonth } from "./time.js";
import { DEFAULT_ACCENT, DEMO, DEMO_ACTIONS, applyBoot, clearUserCaches, loadBootCache, resetUserData, state, store } from "./state.js";
import {
  $,
  applyTheme,
  closeDropdowns,
  closeOnOutsideClick,
  confirmDialog,
  dark,
  filterDropdown,
  initRender,
  isDark,
  loadDoc,
  render,
  renderMenuBody,
  setAccent,
  setMode,
  show,
  toast,
  toggleDropdown,
  view,
} from "./ui.js";
import { icon, langPicker, tick } from "./views.js";

async function changeLanguage(code) {
  try {
    await setLang(code, !DEMO);
  } catch (error) {
    log.error("lang", `failed to load ${code}`, error);
    return toast(t("langLoadFailed"));
  }
  applyTheme();
  renderLoginLang();
  if ($("#about").open) $("#about-body").innerHTML = await loadDoc(loginDocId);
  if (state.tab === "doc") state.docHtml = await loadDoc(state.doc);
  if (state.user) render();
}

const PICKERS = {
  char: selectBondChar,
  "cal-ym": (month) => !DEMO && month !== state.calMonth && loadCalendar(month),
  tz: (timeZone) => !DEMO && saveProfile({ timezone: timeZone || null }),
  lang: changeLanguage,
};

function openTab(tab, { closeMenu = false, scrollTop = false } = {}) {
  if (closeMenu) $("#menu").close();
  state.tab = tab;
  render(true);
  if (scrollTop) scrollTo(0, 0);
}

async function openDoc(id, options) {
  state.doc = id;
  state.docHtml = await loadDoc(id);
  openTab("doc", { scrollTop: true, ...options });
}

const thisMonth = () => logicalMonth(Date.now());

const actions = {
  tap: recordTap,
  "notice-open"() {
    if (state.notice) store.set("seenUpdate", state.notice.id);
    state.notice = null;
    return openDoc("changelog");
  },
  "ticket-use"(button) {
    const field = `ticket${button.dataset.n}_time`;
    const usedAt = state.profile[field];
    if (usedAt && Date.parse(usedAt) + TICKET_COOLDOWN > Date.now()) return;
    saveProfile({ [field]: new Date().toISOString() });
  },
  "dd-toggle": toggleDropdown,
  "dd-pick"(button) {
    closeDropdowns();
    return PICKERS[button.dataset.field]?.(button.dataset.value);
  },
  "gifts-scroll"(button) {
    const list = button.parentElement.querySelector(".gifts");
    list.scrollBy({ left: Number(button.dataset.dir) * list.clientWidth * 0.8, behavior: "smooth" });
  },
  "save-image": saveCalendarImage,
  "theme-toggle"() {
    setMode(isDark() ? "light" : "dark");
    render();
  },
  "export-data": () => withPending("export-data", exportData),
  "cal-today": () => state.calMonth !== thisMonth() && loadCalendar(thisMonth()),
  "cal-prev": () => loadCalendar(prevMonth(state.calMonth)),
  "cal-next": () => loadCalendar(nextMonth(state.calMonth)),
  day: (button) => selectDay(button.dataset.day),
  "bond-del": (button) => deleteBond(button.dataset.id),
  push: () =>
    withPending("push", () =>
      guarded(async () => {
        if (state.pushOn) await disablePush();
        else await enablePush();
        state.pushOn = pushEnabled();
      }),
    ),
  doc: (button) => openDoc(button.dataset.doc, { closeMenu: true }),
  mode(button) {
    setMode(button.dataset.mode);
    render();
  },
  home: () => (state.tab === "timer" ? scrollTo(0, 0) : openTab("timer", { scrollTop: true })),
  settings: () => openTab("settings", { closeMenu: true }),
  "accent-reset"() {
    setAccent(DEFAULT_ACCENT);
    render();
  },
  async logout() {
    if (await confirmDialog(t("confirmLogout"), t("logout"))) return logoutDevice();
  },
  "delete-account": deleteAccount,
};

function reboundButton(button) {
  if (button.isConnected) return;
  const { act, n: ticketNumber, day } = button.dataset;
  const selector = `[data-act="${act}"]${ticketNumber ? `[data-n="${ticketNumber}"]` : ""}${day ? `[data-day="${day}"]` : ""}`;
  const replacement = document.querySelector(selector);
  if (!replacement) return;
  replacement.classList.add("rebound");
  replacement.addEventListener("animationend", () => replacement.classList.remove("rebound"), { once: true });
}

function onClick(event) {
  if (!event.target.closest(".dd")) closeDropdowns();
  const button = event.target.closest("[data-act]");
  if (!button || button.disabled) return;
  const { act } = button.dataset;
  log.info("click", act, { ...button.dataset });
  if (DEMO && !DEMO_ACTIONS.has(act)) return;
  Promise.resolve()
    .then(() => actions[act]?.(button))
    .catch((error) => log.error("click", `action failed: ${act}`, error));
  reboundButton(button);
}

function onNavClick(event) {
  const button = event.target.closest("[data-tab]");
  if (!button || state.tab === button.dataset.tab) return;
  state.tab = button.dataset.tab;
  render(true);
  if (!state.bondReady && !state.deferredLoading) loadDeferred();
}

function onInput(event) {
  const input = event.target;
  if (input.matches(".dd-q")) return filterDropdown(input);
  if (input.name === "bond_level") {
    const digits = input.value.replace(/\D/g, "");
    input.value = digits === "" ? "" : String(Math.min(BOND_MAX, Math.max(1, Number(digits))));
  } else if (input.dataset.form === "accent") setAccent(input.value);
}

async function onChange(event) {
  const input = event.target;
  if (DEMO || input.dataset.form !== "import" || !input.files[0]) return;
  const file = input.files[0];
  input.value = "";
  await importFile(file);
}

function initEvents() {
  document.addEventListener("click", onClick);
  document.addEventListener("input", onInput);
  document.addEventListener("change", onChange);
  view.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!DEMO && event.target.dataset.form === "bond") submitBond(event.target);
  });

  document.addEventListener("keydown", (event) => {
    const label = event.target instanceof Element && event.target.matches("label.menu-item") ? event.target : null;
    if (!label || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    label.querySelector("input")?.click();
  });

  document.addEventListener("error", (event) => event.target.matches?.("img.dd-icon, img.bond-icon, .avatar img") && event.target.remove(), true);

  const isTextField = (event) => event.target instanceof Element && event.target.closest("input, textarea");
  for (const type of ["copy", "cut", "selectstart", "dragstart"]) document.addEventListener(type, (event) => isTextField(event) || event.preventDefault());

  document.addEventListener(
    "wheel",
    (event) => {
      const list = event.target instanceof Element && event.target.closest(".gifts, .ads-list");
      if (list && list.scrollWidth > list.clientWidth && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        list.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    },
    { passive: false },
  );

  $("#menu-btn").innerHTML = icon("menu");
  $("#menu-btn").addEventListener("click", () => {
    renderMenuBody();
    $("#menu").showModal();
  });
  closeOnOutsideClick($("#menu"));
  closeOnOutsideClick($("#confirm"));

  const NAV_ICONS = { timer: "timer", calendar: "calendar", bond: "heart" };
  for (const button of document.querySelectorAll("nav button")) button.innerHTML = icon(NAV_ICONS[button.dataset.tab], 28);
  document.querySelector("nav").addEventListener("click", onNavClick);
}

let loginDocId = "about";
const renderLoginLang = () => ($("#login-lang").innerHTML = langPicker(getLang()));

function initLoginScreen() {
  renderLoginLang();
  for (const [buttonSelector, docId] of [["#about-btn", "about"], ["#guide-btn", "guide"]]) {
    $(buttonSelector).addEventListener("click", async () => {
      loginDocId = docId;
      $("#about-body").innerHTML = await loadDoc(docId);
      $("#about").showModal();
    });
  }
  $("#about-close").addEventListener("click", () => $("#about").close());
  closeOnOutsideClick($("#about"));

  $("#login-btn").addEventListener("click", async () => {
    link.auto = true;
    if (!(await guarded(login))) link.auto = false;
  });

  $("#reauth-btn").addEventListener("click", async () => {
    if (!(await guarded(async () => api.linkDrive(await requestDriveCode())))) return;
    $("#reauth").hidden = true;
    await flush();
    loadAll();
  });
}

async function startDemo() {
  const { applyDemo, demoLang, demoMenu } = __DEMO_BUILD__ ? await import("./demo.js") : {};
  $("#home-btn").addEventListener("click", () => location.assign("/"));
  if (demoLang) await setLang(demoLang, false);
  applyDemo(state);
  applyTheme();
  show("app");
  if (state.tab === "doc") state.docHtml = await loadDoc(state.doc);
  render();
  if (demoMenu) {
    renderMenuBody();
    $("#menu").showModal();
  }
}

function onSignedOut() {
  clearGameDataCache();
  clearUserCaches();
  clearCalendarCache();
  clearWorkerOutbox();
  store.set("uid", "");
  resetUserData();
  show("login");
  preloadGsi();
}

function startApp() {
  initOutbox();
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && refresh());

  const loadAllowedAt = Date.now() + reloadWaitMs();
  const loadNow = () =>
    loadAll().finally(() => {
      flush();
      state.loading = false;
      render();
      (window.requestIdleCallback ?? setTimeout)(loadAds);
    });
  const startLoading = () => {
    const waitMs = loadAllowedAt - Date.now();
    if (waitMs <= 0) return loadNow();
    toast(t("reloadTooOften", { seconds: Math.ceil(waitMs / 1000) }));
    setTimeout(loadNow, waitMs);
  };

  const previousUid = store.get("uid", "");
  const previousCache = previousUid && loadBootCache(previousUid);
  let shownEarly = false;
  if (previousCache) {
    applyBoot(previousCache);
    primeBond(previousUid);
    state.user = { uid: previousUid };
    shownEarly = true;
    show("app");
    render();
    startLoading();
  }

  onUser((user) => {
    log.info("auth", `user=${user ? "signed in" : "none"} shownEarly=${shownEarly}`);
    const alreadyLoading = shownEarly && user?.uid === previousUid;
    if (shownEarly && !alreadyLoading) {
      resetUserData();
      clearCalendarCache();
    }
    shownEarly = false;
    state.user = user;
    if (!user) return onSignedOut();
    store.set("uid", user.uid);
    show("app");
    if (!alreadyLoading) {
      const cache = loadBootCache(user.uid);
      if (cache) applyBoot(cache);
      primeBond(user.uid);
      state.loading = !cache;
      render();
    }
    (window.requestIdleCallback ?? setTimeout)(() => showForegroundNotifications().catch(() => {}));
    flush();
    if (!alreadyLoading) startLoading();
  });
}

initRender();
initEvents();
initLoginScreen();
dark.addEventListener("change", applyTheme);
applyStatic();
applyTheme();
setInterval(() => tick(view), 1000);

if (DEMO) await startDemo();
else {
  startApp();
  // PWA としてインストールできるよう、通知を使わなくても登録する
  if ("serviceWorker" in navigator && !pushEnabled()) registerWorker().catch(() => {});
}

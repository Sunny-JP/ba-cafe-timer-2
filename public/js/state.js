import { CHARACTERS } from "./gamedata.js";
import { pushEnabled, pushSupported } from "./push.js";
import { logicalMonth } from "./time.js";
import { UPDATE_LOGS } from "./updates.js";

export const DEMO = __DEMO_BUILD__;
export const DEMO_ACTIONS = new Set(["dd-toggle", "dd-pick", "gifts-scroll", "theme-toggle", "day", "settings", "doc", "mode", "accent-reset"]);

export const CAL_MIN = "2026-01";
export const MODES = ["auto", "light", "dark"];
export const DEFAULT_ACCENT = "#4355b9";

export const store = {
  get(key, fallback, allowed) {
    try {
      const value = localStorage.getItem(`ct.${key}`);
      return allowed ? (allowed.includes(value) ? value : fallback) : (value ?? fallback);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (DEMO) return;
    try {
      localStorage.setItem(`ct.${key}`, value);
    } catch {}
  },
  json(key) {
    try {
      return JSON.parse(this.get(key, "null"));
    } catch {
      return null;
    }
  },
};

const emptyProfile = () => ({ ticket1_time: null, ticket2_time: null, timezone: null });

const savedAccent = store.get("accent", "");
const latestNotice = UPDATE_LOGS[0];

export const state = {
  mode: store.get("mode", "auto", MODES),
  accent: /^#[0-9a-f]{6}$/i.test(savedAccent) ? savedAccent : DEFAULT_ACCENT,
  user: null,
  notice: !DEMO && latestNotice && store.get("seenUpdate", "") !== latestNotice.id ? latestNotice : null,
  tab: "timer",
  doc: null,
  docHtml: null,
  profile: emptyProfile(),
  lastTap: null,
  monthTaps: [],
  calMonth: logicalMonth(Date.now()),
  calTaps: [],
  calLoading: false,
  selectedDay: null,
  relationship: [],
  bondChar: null,
  bondLevel: null,
  bondDate: null,
  bondReady: false,
  deferredLoading: false,
  loading: false,
  syncing: !DEMO,
  ads: null,
  adsEnabled: store.get("ads", "") === "1",
  pending: new Set(),
  pushSupported: pushSupported(),
  pushOn: pushEnabled(),
};

const bootKey = (uid) => `boot.${uid}`;
const relKey = (uid) => `rel.${uid}`;

export function saveBootCache() {
  if (!DEMO && state.user) {
    const { calMonth: month, profile, lastTap: last_tap, monthTaps: taps } = state;
    store.set(bootKey(state.user.uid), JSON.stringify({ month, profile, last_tap, taps }));
  }
}

export function loadBootCache(uid) {
  const cache = store.json(bootKey(uid));
  return cache && cache.month === logicalMonth(Date.now()) && Array.isArray(cache.taps) ? cache : null;
}

export const applyBoot = (cache) =>
  Object.assign(state, { profile: cache.profile, lastTap: cache.last_tap, monthTaps: cache.taps, calMonth: cache.month, calTaps: cache.taps });

export function saveRelCache() {
  if (!DEMO && state.user) store.set(relKey(state.user.uid), JSON.stringify(state.relationship));
}

export const loadRelCache = (uid) => {
  const rel = store.json(relKey(uid));
  return Array.isArray(rel) ? rel : null;
};

export function clearUserCaches() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith("ct.boot.") || key.startsWith("ct.rel.")) localStorage.removeItem(key);
  } catch {}
}

export function initBondChar() {
  state.bondChar ??= store.get("char", CHARACTERS[0]?.key, CHARACTERS.map((character) => character.key));
}

export function resetUserData() {
  Object.assign(state, {
    profile: emptyProfile(),
    lastTap: null,
    monthTaps: [],
    calTaps: [],
    relationship: [],
    bondReady: false,
    deferredLoading: false,
    selectedDay: null,
    syncing: true,
  });
}

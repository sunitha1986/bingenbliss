import crypto from "node:crypto";
import { readStore, writeStore } from "../config/db.js";
import { normalizePhone } from "../utils/normalizePhone.js";
import {
  appendLuckyDrawSpin,
  readLatestLuckyDrawSpin,
  readLuckyDrawCustomers,
  readLuckyDrawSpins,
  withLuckyDrawCycleLock as withCycleLock,
} from "../config/luckyDrawDatabase.js";

const defaultCelebrationOccasions = [
  "Birthday party",
  "Anniversary",
];

export async function getLuckyDrawWheelEnabled() {
  const store = await readStore();
  const autoResetAt = store.luckyDrawSettings?.autoResetVisibilityAt || 0;
  if (
    autoResetAt &&
    Date.now() >= autoResetAt &&
    store.luckyDrawSettings?.isDrawing
  ) {
    store.luckyDrawSettings.autoResetVisibilityAt = 0;
    store.luckyDrawSettings.isDrawing = false;
    store.luckyDrawSettings.drawingUntil = 0;
    await writeStore(store);
  }
  if (typeof store.luckyDrawSettings?.wheelEnabled === "boolean") {
    return store.luckyDrawSettings.wheelEnabled;
  }
  return true;
}

export async function setLuckyDrawWheelEnabled(enabled) {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    wheelEnabled: Boolean(enabled),
    autoResetVisibilityAt: 0,
    ...(enabled ? { manualDrawCompleted: false } : {}),
  };
  await writeStore(store);
  return store.luckyDrawSettings.wheelEnabled;
}

export async function setLuckyDrawSpinningState(isDrawing, winner = null) {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    isDrawing: Boolean(isDrawing),
    drawingUntil: isDrawing ? Date.now() + 9500 : 0,
    drawingWinner: winner,
    autoResetVisibilityAt: isDrawing ? Date.now() + 9500 : 0,
  };
  await writeStore(store);
}

export async function getLuckyDrawSpinningState() {
  const store = await readStore();
  const drawingUntil = store.luckyDrawSettings?.drawingUntil || 0;
  const isDrawing = Boolean(
    store.luckyDrawSettings?.isDrawing && Date.now() < drawingUntil,
  );
  return {
    isDrawing,
    drawingWinner: isDrawing ? store.luckyDrawSettings?.drawingWinner : null,
  };
}

export async function getLuckyDrawFeatureSettings() {
  const store = await readStore();
  const settings = store.luckyDrawSettings || {};

  return {
    annualEligibilityEnabled: settings.annualEligibilityEnabled !== false,
    previousWinnerExclusionEnabled:
      typeof settings.previousWinnerExclusionEnabled === "boolean"
        ? settings.previousWinnerExclusionEnabled
        : settings.annualEligibilityEnabled !== false,
    manualDrawCompleted:
      typeof settings.manualDrawCompleted === "boolean"
        ? settings.manualDrawCompleted
        : null,
    includeAllEntriesNextDraw: settings.includeAllEntriesNextDraw === true,
    includeAllThisMonthEntriesNextDraw:
      settings.includeAllThisMonthEntriesNextDraw === true,
    includeAllThisMonthEntriesMonth:
      typeof settings.includeAllThisMonthEntriesMonth === "string"
        ? settings.includeAllThisMonthEntriesMonth
        : "",
    nextDrawDate:
      typeof settings.nextDrawDate === "string" ? settings.nextDrawDate : "",
    drawDate:
      typeof settings.nextDrawDate === "string" ? settings.nextDrawDate : "",
    celebrationOccasions:
      Array.isArray(settings.celebrationOccasions) &&
      settings.celebrationOccasions.length > 0
        ? settings.celebrationOccasions
        : defaultCelebrationOccasions,
  };
}

export async function setLuckyDrawNextDrawDate(nextDrawDate) {
  const store = await readStore();
  const cleanDate = typeof nextDrawDate === "string" ? nextDrawDate.trim() : "";
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    nextDrawDate: cleanDate,
    drawDate: cleanDate,
  };
  await writeStore(store);
  return cleanDate;
}

export async function setLuckyDrawCelebrationOccasions(occasions) {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    celebrationOccasions: occasions,
  };
  await writeStore(store);
  return occasions;
}

export async function setLuckyDrawFeatureSettings(updates) {
  const store = await readStore();
  const settings = store.luckyDrawSettings || {};
  store.luckyDrawSettings = {
    ...settings,
    annualEligibilityEnabled: updates.annualEligibilityEnabled !== false,
    previousWinnerExclusionEnabled: updates.previousWinnerExclusionEnabled !== false,
  };
  await writeStore(store);
  return getLuckyDrawFeatureSettings();
}

export async function setLuckyDrawIncludeAllEntriesNextDraw(enabled) {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    includeAllEntriesNextDraw: Boolean(enabled),
    ...(enabled && {
      includeAllThisMonthEntriesNextDraw: false,
      includeAllThisMonthEntriesMonth: "",
    }),
  };
  await writeStore(store);
  return store.luckyDrawSettings.includeAllEntriesNextDraw;
}

export async function setLuckyDrawIncludeAllThisMonthEntriesNextDraw(enabled) {
  const store = await readStore();
  const now = new Date();
  const monthParts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    })
      .formatToParts(now)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    includeAllThisMonthEntriesNextDraw: Boolean(enabled),
    includeAllThisMonthEntriesMonth: enabled
      ? `${monthParts.year}-${monthParts.month}`
      : "",
    ...(enabled && { includeAllEntriesNextDraw: false }),
  };
  await writeStore(store);
  return {
    includeAllThisMonthEntriesNextDraw:
      store.luckyDrawSettings.includeAllThisMonthEntriesNextDraw,
    includeAllThisMonthEntriesMonth:
      store.luckyDrawSettings.includeAllThisMonthEntriesMonth,
  };
}

export async function clearLuckyDrawNextDrawEligibilityOptions() {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    includeAllEntriesNextDraw: false,
    includeAllThisMonthEntriesNextDraw: false,
    includeAllThisMonthEntriesMonth: "",
  };
  await writeStore(store);
}

export async function setLuckyDrawManualDrawCompleted() {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    manualDrawCompleted: true,
  };
  await writeStore(store);
}

export async function getLuckyDrawLastSpin() {
  try {
    return await readLatestLuckyDrawSpin();
  } catch (error) {
    console.error(
      "[luckyDrawModel] Failed to read latest spin from database:",
      error.message,
    );
    const store = await readStore();
    const history = store.luckyDrawHistory || [];
    return history[history.length - 1] || null;
  }
}

export async function getLuckyDrawWinnerHistory() {
  try {
    return await readLuckyDrawSpins();
  } catch (error) {
    console.error(
      "[luckyDrawModel] Failed to read spins from database:",
      error.message,
    );
    const store = await readStore();
    return store.luckyDrawHistory || [];
  }
}

export async function recordLuckyDrawSpin(winner, options) {
  return appendLuckyDrawSpin(
    {
      id: crypto.randomUUID(),
      winner,
      spunAt: new Date().toISOString(),
    },
    options,
  );
}

export function withLuckyDrawCycleLock(cycle, action) {
  return withCycleLock(cycle, action);
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || null,
    phone: user.phone || null,
    coupon: user.coupon,
    couponUsed: user.couponUsed,
  };
}

export async function findOrCreateUserByPhone(phone) {
  const store = await readStore();
  let user = store.users.find(
    (candidate) => normalizePhone(candidate.phone) === phone,
  );

  if (!user) {
    const customers = await readLuckyDrawCustomers();
    const customer = customers.find(
      (candidate) =>
        normalizePhone(candidate.Phone || candidate.phone) === phone,
    );
    if (!customer) return null;

    user = {
      id: crypto.randomUUID(),
      email: `${phone}@customer.bingenbliss.local`,
      name: customer.Name,
      phone,
      coupon: "BLISS10",
      couponUsed: false,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    await writeStore(store);
  } else if (user.phone !== phone) {
    user.phone = phone;
    await writeStore(store);
  }

  return user;
}

export async function findOrCreateUser(email) {
  const store = await readStore();
  let user = store.users.find((candidate) => candidate.email === email);

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      coupon: "BLISS10",
      couponUsed: false,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    await writeStore(store);
  }

  return user;
}

export async function findUserByEmail(email) {
  const store = await readStore();
  return store.users.find((candidate) => candidate.email === email);
}

export async function saveOrder(order, user) {
  const store = await readStore();
  store.orders.push(order);
  await writeStore(store);
  return { order, user: publicUser(user) };
}

export async function markCouponUsed(email) {
  const store = await readStore();
  const user = store.users.find((candidate) => candidate.email === email);
  if (user) {
    user.couponUsed = true;
    await writeStore(store);
  }
}

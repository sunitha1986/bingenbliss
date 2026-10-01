import crypto from "node:crypto";
import { readStore, writeStore } from "../config/db.js";
import { readLuckyDrawCustomers } from "../config/luckyDrawDatabase.js";

export async function getLuckyDrawWheelEnabled() {
  const store = await readStore();
  return Boolean(store.luckyDrawSettings?.wheelEnabled);
}

export async function setLuckyDrawWheelEnabled(enabled) {
  const store = await readStore();
  store.luckyDrawSettings = {
    ...store.luckyDrawSettings,
    wheelEnabled: Boolean(enabled),
  };
  await writeStore(store);
  return store.luckyDrawSettings.wheelEnabled;
}

export async function getLuckyDrawFeatureSettings() {
  const store = await readStore();
  const settings = store.luckyDrawSettings || {};
  return {
    annualEligibilityEnabled: settings.annualEligibilityEnabled !== false,
  };
}

export async function setLuckyDrawFeatureSettings(updates) {
  const store = await readStore();
  const settings = store.luckyDrawSettings || {};
  store.luckyDrawSettings = {
    ...settings,
    ...(typeof updates.annualEligibilityEnabled === "boolean" && {
      annualEligibilityEnabled: updates.annualEligibilityEnabled,
    }),
  };
  await writeStore(store);
  return {
    annualEligibilityEnabled:
      store.luckyDrawSettings.annualEligibilityEnabled !== false,
  };
}

export async function getLuckyDrawLastSpin() {
  const store = await readStore();
  return store.luckyDrawSettings?.lastSpin || null;
}

export async function getLuckyDrawWinnerHistory() {
  const store = await readStore();
  const settings = store.luckyDrawSettings || {};
  const winnerHistory = Array.isArray(settings.winnerHistory)
    ? [...settings.winnerHistory]
    : [];

  if (
    settings.lastSpin &&
    !winnerHistory.some((spin) => spin.id === settings.lastSpin.id)
  ) {
    winnerHistory.push(settings.lastSpin);
  }

  return winnerHistory;
}

export async function recordLuckyDrawSpin(winner) {
  const store = await readStore();
  const settings = store.luckyDrawSettings || {};
  const lastSpin = {
    id: crypto.randomUUID(),
    winner,
    spunAt: new Date().toISOString(),
  };
  store.luckyDrawSettings = {
    ...settings,
    lastSpin,
    winnerHistory: [
      ...(Array.isArray(settings.winnerHistory) ? settings.winnerHistory : []),
      ...(settings.lastSpin &&
      !settings.winnerHistory?.some((spin) => spin.id === settings.lastSpin.id)
        ? [settings.lastSpin]
        : []),
      lastSpin,
    ],
  };
  await writeStore(store);
  return lastSpin;
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
  let user = store.users.find((candidate) => candidate.phone === phone);

  if (!user) {
    const customers = await readLuckyDrawCustomers();
    const customer = customers.find(
      (candidate) => String(candidate.Phone) === phone,
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

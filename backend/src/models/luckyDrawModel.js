import crypto from "node:crypto";
import { readStore, writeStore } from "../config/db.js";

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    coupon: user.coupon,
    couponUsed: user.couponUsed,
  };
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

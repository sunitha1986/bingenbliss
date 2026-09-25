import crypto from "node:crypto";
import {
  findOrCreateUser,
  findUserByEmail,
  markCouponUsed,
  publicUser,
  saveOrder,
} from "../models/luckyDrawModel.js";

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validAmount(amount) {
  return Number.isFinite(Number(amount)) && Number(amount) > 0;
}

export async function login(request, response, next) {
  try {
    const email = request.body?.email?.trim().toLowerCase();
    if (!validEmail(email)) {
      return response
        .status(400)
        .json({ message: "Enter a valid email address" });
    }

    const user = await findOrCreateUser(email);
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

export async function validateCoupon(request, response, next) {
  try {
    const { email, code, amount } = request.body || {};
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedCode = code?.trim().toUpperCase();
    if (!validEmail(normalizedEmail) || !validAmount(amount)) {
      return response
        .status(400)
        .json({ message: "A valid email and order amount are required" });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user || user.coupon !== normalizedCode) {
      return response
        .status(400)
        .json({ message: "That coupon is not valid for this account" });
    }
    if (user.couponUsed) {
      return response
        .status(400)
        .json({ message: "This coupon has already been used" });
    }

    const subtotal = Number(amount);
    const discount = Math.round(subtotal * 0.1 * 100) / 100;
    return response.json({ valid: true, discount, total: subtotal - discount });
  } catch (error) {
    return next(error);
  }
}

export async function createOrder(request, response, next) {
  try {
    const { email, name, phone, event, date, guests, amount, coupon } =
      request.body || {};
    const normalizedEmail = email?.trim().toLowerCase();
    const subtotal = Number(amount);
    if (
      !validEmail(normalizedEmail) ||
      !name?.trim() ||
      !phone?.trim() ||
      !event ||
      !date ||
      Number(guests) < 1 ||
      !validAmount(subtotal)
    ) {
      return response
        .status(400)
        .json({ message: "Complete all booking details before submitting" });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return response
        .status(401)
        .json({ message: "Please sign in before booking" });
    }

    let discount = 0;
    const normalizedCode = coupon?.trim().toUpperCase();
    if (normalizedCode) {
      if (user.couponUsed || normalizedCode !== user.coupon) {
        return response
          .status(400)
          .json({ message: "This coupon is no longer available" });
      }
      discount = Math.round(subtotal * 0.1 * 100) / 100;
      await markCouponUsed(normalizedEmail);
    }

    const order = {
      id: crypto.randomUUID(),
      reference: `BNB-${Date.now().toString().slice(-6)}`,
      email: normalizedEmail,
      name: name.trim(),
      phone: phone.trim(),
      event,
      date,
      guests: Number(guests),
      amount: subtotal,
      discount,
      total: subtotal - discount,
      coupon: normalizedCode || null,
      status: "received",
      createdAt: new Date().toISOString(),
    };

    const result = await saveOrder(order, user);
    return response.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function health(_request, response) {
  response.json({ ok: true });
}

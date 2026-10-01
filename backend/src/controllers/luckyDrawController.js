import crypto from "node:crypto";
import { createAdminToken, isAdminToken } from "../config/adminAuth.js";
import {
  appendLuckyDrawCustomer,
  deleteLuckyDrawCustomer as deleteCustomerRecord,
  readLuckyDrawCustomers,
  updateLuckyDrawCustomer as updateCustomerRecord,
} from "../config/luckyDrawDatabase.js";
import { notifyLuckyDrawWinner } from "../services/whatsapp.js";
import {
  findOrCreateUser,
  findOrCreateUserByPhone,
  findUserByEmail,
  getLuckyDrawFeatureSettings,
  getLuckyDrawLastSpin,
  getLuckyDrawWinnerHistory,
  getLuckyDrawWheelEnabled,
  markCouponUsed,
  publicUser,
  recordLuckyDrawSpin,
  saveOrder,
  setLuckyDrawFeatureSettings,
  setLuckyDrawWheelEnabled,
} from "../models/luckyDrawModel.js";

const oneYearInMs = 365 * 24 * 60 * 60 * 1000;

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function isWithinOneYear(date, now = Date.now()) {
  const timestamp = Date.parse(date);
  return (
    Number.isFinite(timestamp) &&
    timestamp >= now - oneYearInMs &&
    timestamp <= now
  );
}

function getEligibleLuckyDrawCustomers(
  customers,
  winnerHistory,
  annualEligibilityEnabled,
) {
  if (!annualEligibilityEnabled) return customers;

  const recentWinners = new Set(
    winnerHistory
      .filter((spin) => isWithinOneYear(spin.spunAt))
      .map((spin) => normalizePhone(spin.winner?.Phone || spin.winner?.phone))
      .filter(Boolean),
  );

  return customers.filter(
    (customer) =>
      isWithinOneYear(customer["Submitted at"] || customer.submittedAt) &&
      !recentWinners.has(normalizePhone(customer.Phone || customer.phone)),
  );
}

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validAmount(amount) {
  return Number.isFinite(Number(amount)) && Number(amount) > 0;
}

function validPhone(phone) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) return false;
  if (/^(\d)\1{9}$/.test(cleanPhone)) return false;
  if (cleanPhone === "9876543210" || cleanPhone === "1234567890") return false;
  return true;
}

export async function login(request, response, next) {
  try {
    const phone = request.body?.phone?.replace(/\D/g, "");
    if (phone) {
      if (!validPhone(phone)) {
        return response
          .status(400)
          .json({ message: "Enter a valid 10-digit phone number" });
      }

      const user = await findOrCreateUserByPhone(phone);
      if (!user) {
        return response.status(404).json({
          message: "No customer account was found for this phone number",
        });
      }
      return response.json({ user: publicUser(user) });
    }

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

export async function createLuckyDrawEntry(request, response, next) {
  try {
    const { name, phone, dob, occasion, date, guests, consent } =
      request.body || {};
    const celebrationDate = date || dob;
    const normalizedPhone = (phone || "").replace(/\D/g, "");

    if (
      !name?.trim() ||
      !validPhone(normalizedPhone) ||
      !celebrationDate ||
      !occasion?.trim() ||
      !guests ||
      Number(guests) < 1
    ) {
      return response.status(400).json({
        message:
          "Please complete all registration details with a valid 10-digit WhatsApp number.",
      });
    }

    if (consent === false) {
      return response.status(400).json({
        message:
          "Please check the consent box to enter the lucky draw and receive updates.",
      });
    }

    const { annualEligibilityEnabled } = await getLuckyDrawFeatureSettings();
    if (annualEligibilityEnabled) {
      const existingCustomers = await readLuckyDrawCustomers();
      const hasRecentEntry = existingCustomers.some(
        (customer) =>
          normalizePhone(customer.Phone || customer.phone) ===
            normalizedPhone &&
          isWithinOneYear(customer["Submitted at"] || customer.submittedAt),
      );
      if (hasRecentEntry) {
        return response.status(409).json({
          message:
            "This phone number is already registered. Each phone number may enter the lucky draw once every 12 months.",
        });
      }
    }

    const customer = {
      Name: name.trim(),
      Phone: normalizedPhone,
      "Date of birth": celebrationDate,
      Occasion: occasion.trim(),
      "Celebration date": celebrationDate,
      Guests: Number(guests),
      Consent: consent ? "Yes" : "No",
      "Submitted at": new Date().toISOString(),
    };
    await appendLuckyDrawCustomer(customer);

    const user = await findOrCreateUserByPhone(normalizedPhone);
    if (user && !user.name) {
      user.name = name.trim();
    }

    return response.status(201).json({
      customer,
      user: user
        ? publicUser(user)
        : { name: name.trim(), phone: normalizedPhone },
    });
  } catch (error) {
    return next(error);
  }
}

export async function luckyDrawStatus(request, response, next) {
  try {
    const isDrawDay = new Date().getDate() === 1;
    const wheelEnabled = await getLuckyDrawWheelEnabled();
    const featureSettings = await getLuckyDrawFeatureSettings();
    const lastSpin = await getLuckyDrawLastSpin();
    const customers = await readLuckyDrawCustomers();
    const winnerHistory = await getLuckyDrawWinnerHistory();
    const eligibleCustomers = getEligibleLuckyDrawCustomers(
      customers,
      winnerHistory,
      featureSettings.annualEligibilityEnabled,
    );
    return response.json({
      isDrawDay,
      wheelEnabled,
      showWheel: wheelEnabled,
      ...featureSettings,
      lastSpin,
      entries: eligibleCustomers.map((customer, index) => ({
        id: String(index),
        name: customer.Name,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listLuckyDrawWinners(request, response, next) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }

    const winnerHistory = await getLuckyDrawWinnerHistory();
    const winners = winnerHistory
      .filter((spin) => spin?.winner)
      .map((spin) => ({
        id: String(spin.id || spin.spunAt),
        name: spin.winner.Name || spin.winner.name || "Lucky Winner",
        occasion:
          spin.winner.Occasion || spin.winner.occasion || "Special Celebration",
        announcedAt: spin.spunAt || null,
      }))
      .sort(
        (first, second) =>
          Date.parse(second.announcedAt || 0) -
          Date.parse(first.announcedAt || 0),
      );

    return response.json({ winners });
  } catch (error) {
    return next(error);
  }
}

export async function adminLogin(request, response) {
  const { email, password } = request.body || {};
  const token = createAdminToken(email, password);
  if (!token) {
    return response.status(401).json({ message: "Invalid admin credentials" });
  }
  return response.json({ token });
}

export async function spinLuckyDraw(request, response, next) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }

    const customers = await readLuckyDrawCustomers();
    const winnerHistory = await getLuckyDrawWinnerHistory();
    const { annualEligibilityEnabled } = await getLuckyDrawFeatureSettings();
    const eligibleCustomers = getEligibleLuckyDrawCustomers(
      customers,
      winnerHistory,
      annualEligibilityEnabled,
    );

    if (!eligibleCustomers.length) {
      return response
        .status(400)
        .json({ message: "No eligible lucky draw entries are available" });
    }

    const winner =
      eligibleCustomers[Math.floor(Math.random() * eligibleCustomers.length)];
    const lastSpin = await recordLuckyDrawSpin(winner);
    const whatsapp = await notifyLuckyDrawWinner(winner);
    return response.json({ winner, spinId: lastSpin.id, whatsapp });
  } catch (error) {
    return next(error);
  }
}

export async function setLuckyDrawVisibility(request, response, next) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }

    const wheelEnabled = await setLuckyDrawWheelEnabled(request.body?.enabled);
    return response.json({ wheelEnabled });
  } catch (error) {
    return next(error);
  }
}

export async function updateLuckyDrawFeatures(request, response, next) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }

    const { annualEligibilityEnabled } = request.body || {};
    if (typeof annualEligibilityEnabled !== "boolean") {
      return response.status(400).json({
        message: "Annual eligibility setting must be provided.",
      });
    }

    const settings = await setLuckyDrawFeatureSettings({
      annualEligibilityEnabled,
    });
    return response.json(settings);
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(request, response) {
  if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
    response.status(401).json({ message: "Admin access is required" });
    return false;
  }
  return true;
}

export async function listLuckyDrawCustomers(request, response, next) {
  try {
    if (!requireAdmin(request, response)) return;
    const customers = await readLuckyDrawCustomers();
    return response.json({ customers });
  } catch (error) {
    return next(error);
  }
}

export async function updateLuckyDrawCustomer(request, response, next) {
  try {
    if (!requireAdmin(request, response)) return;
    const customerId = request.params.customerId;
    const { name, phone, dob } = request.body || {};
    if (
      !/^[1-9][0-9]*$/.test(customerId) ||
      !name?.trim() ||
      !/^[0-9]{10}$/.test(phone || "") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dob || "")
    ) {
      return response
        .status(400)
        .json({ message: "Enter valid customer details" });
    }

    const customer = await updateCustomerRecord(customerId, {
      name: name.trim(),
      phone,
      dob,
    });
    if (!customer) {
      return response.status(404).json({ message: "Customer not found" });
    }

    return response.json({ customer });
  } catch (error) {
    return next(error);
  }
}

export async function deleteLuckyDrawCustomer(request, response, next) {
  try {
    if (!requireAdmin(request, response)) return;
    const customerId = request.params.customerId;
    if (!/^[1-9][0-9]*$/.test(customerId)) {
      return response.status(400).json({ message: "Invalid customer id" });
    }

    const deleted = await deleteCustomerRecord(customerId);
    if (!deleted) {
      return response.status(404).json({ message: "Customer not found" });
    }

    return response.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
}

export async function health(_request, response) {
  response.json({ ok: true });
}

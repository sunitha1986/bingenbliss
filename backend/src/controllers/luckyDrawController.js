import crypto from "node:crypto";
import { createAdminToken, isAdminToken } from "../config/adminAuth.js";
import {
  appendLuckyDrawCustomer,
  deleteLuckyDrawCustomer as deleteCustomerRecord,
  readLuckyDrawCustomers,
  updateLuckyDrawCustomer as updateCustomerRecord,
} from "../config/luckyDrawDatabase.js";
import { notifyLuckyDrawWinner } from "../services/whatsapp.js";
import { normalizePhone } from "../utils/normalizePhone.js";
import {
  findOrCreateUser,
  findOrCreateUserByPhone,
  findUserByEmail,
  clearLuckyDrawNextDrawEligibilityOptions,
  getLuckyDrawFeatureSettings,
  getLuckyDrawLastSpin,
  getLuckyDrawSpinningState,
  getLuckyDrawWinnerHistory,
  getLuckyDrawWheelEnabled,
  markCouponUsed,
  publicUser,
  recordLuckyDrawSpin,
  saveOrder,
  setLuckyDrawCelebrationOccasions,
  setLuckyDrawIncludeAllEntriesNextDraw as saveIncludeAllEntriesNextDraw,
  setLuckyDrawIncludeAllThisMonthEntriesNextDraw as saveIncludeAllThisMonthEntriesNextDraw,
  setLuckyDrawFeatureSettings,
  setLuckyDrawManualDrawCompleted,
  setLuckyDrawSpinningState,
  setLuckyDrawWheelEnabled,
  withLuckyDrawCycleLock,
} from "../models/luckyDrawModel.js";
import { getEligibleLuckyDrawCustomers } from "../services/luckyDrawEligibility.js";
import {
  getIndiaDrawCountsByMonth,
  getIndiaDrawCycle,
  getIndiaDrawDate,
} from "../utils/indiaDate.js";

function isValidDrawDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

const oneYearInMs = 365 * 24 * 60 * 60 * 1000;

function isWithinOneYear(date, now = Date.now()) {
  const timestamp = Date.parse(date);
  return (
    Number.isFinite(timestamp) &&
    timestamp >= now - oneYearInMs &&
    timestamp <= now
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

function toCustomerProfile(customer) {
  return {
    name: customer.Name || customer.name || "",
    phone: normalizePhone(customer.Phone || customer.phone),
    occasion: customer.Occasion || customer.occasion || "",
    celebrationDate:
      customer["Celebration date"] ||
      customer["Date of birth"] ||
      customer.date ||
      "",
    guests: Number(customer.Guests || customer.guests) || 0,
    registeredAt: customer["Submitted at"] || customer.submittedAt || "",
  };
}

async function findRegisteredCustomerByPhone(phone) {
  const customers = await readLuckyDrawCustomers();
  return (
    customers
      .filter(
        (entry) => normalizePhone(entry.Phone || entry.phone) === phone,
      )
      .sort((left, right) => {
        const leftTime = Date.parse(
          left["Submitted at"] || left.submittedAt || "",
        );
        const rightTime = Date.parse(
          right["Submitted at"] || right.submittedAt || "",
        );
        return (
          (Number.isFinite(rightTime) ? rightTime : 0) -
          (Number.isFinite(leftTime) ? leftTime : 0)
        );
      })[0] || null
  );
}

function validateCustomerLoginPhone(phone) {
  if (!validPhone(phone)) {
    return {
      error: "Enter a valid 10-digit Indian WhatsApp number.",
      status: 400,
    };
  }
  return null;
}

export async function lookupCustomerRegistration(request, response, next) {
  try {
    const phone = normalizePhone(request.body?.phone);
    const validationError = validateCustomerLoginPhone(phone);
    if (validationError) {
      return response
        .status(validationError.status)
        .json({ message: validationError.error });
    }

    const customer = await findRegisteredCustomerByPhone(phone);
    return response.json({ registered: Boolean(customer) });
  } catch (error) {
    return next(error);
  }
}

export async function verifyCustomerLogin(request, response, next) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return response.status(503).json({
        message:
          "Phone OTP sign-in is not enabled in production yet. Please contact us for help.",
      });
    }

    const phone = normalizePhone(request.body?.phone);
    const validationError = validateCustomerLoginPhone(phone);
    if (validationError) {
      return response
        .status(validationError.status)
        .json({ message: validationError.error });
    }

    if (String(request.body?.code || "").trim() !== "7374") {
      return response.status(401).json({ message: "Invalid verification code" });
    }

    const customer = await findRegisteredCustomerByPhone(phone);
    if (!customer) {
      return response.status(404).json({
        message: "No registration was found for this number. Please register.",
      });
    }

    const user = await findOrCreateUserByPhone(phone);
    if (!user) {
      return response.status(404).json({
        message: "No customer account was found for this phone number",
      });
    }
    return response.json({
      user: publicUser(user),
      profile: toCustomerProfile(customer),
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(request, response, next) {
  try {
    const phone = normalizePhone(request.body?.phone);
    if (phone) {
      return response.status(400).json({
        message: "Use the customer OTP verification flow to sign in by phone.",
      });
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
      !isValidDrawDate(celebrationDate) ||
      celebrationDate <= getIndiaDrawDate() ||
      typeof occasion !== "string" ||
      !occasion.trim() ||
      !guests ||
      Number(guests) < 1
    ) {
      return response.status(400).json({
        message:
          celebrationDate &&
            isValidDrawDate(celebrationDate) &&
            celebrationDate <= getIndiaDrawDate()
            ? "Celebration date must be in the future."
            : "Please complete all registration details with a valid 10-digit WhatsApp number.",
      });
    }

    const featureSettings = await getLuckyDrawFeatureSettings();
    if (!featureSettings.celebrationOccasions.includes(occasion.trim())) {
      return response.status(400).json({
        message: "Select an available celebration occasion.",
      });
    }

    if (consent === false) {
      return response.status(400).json({
        message:
          "Please check the consent box to enter the lucky draw and receive updates.",
      });
    }

    if (featureSettings.annualEligibilityEnabled) {
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
      profile: toCustomerProfile(customer),
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
    const wheelEnabled = await getLuckyDrawWheelEnabled();
    const featureSettings = await getLuckyDrawFeatureSettings();
    const { isDrawing, drawingWinner } = await getLuckyDrawSpinningState();
    const lastSpin = await getLuckyDrawLastSpin();
    const customers = await readLuckyDrawCustomers();
    const winnerHistory = await getLuckyDrawWinnerHistory();
    const eligibleCustomers = getEligibleLuckyDrawCustomers(
      customers,
      winnerHistory,
      featureSettings.previousWinnerExclusionEnabled,
      {
        includeAllEntries: featureSettings.includeAllEntriesNextDraw,
        includeAllThisMonthEntries:
          featureSettings.includeAllThisMonthEntriesNextDraw,
        entriesMonth: featureSettings.includeAllThisMonthEntriesMonth,
      },
    );
    const currentCycle = getIndiaDrawCycle();
    const { year: drawCountYear, counts: drawCountsByMonth } =
      getIndiaDrawCountsByMonth(winnerHistory);
    const hasWinnerForCurrentCycle = winnerHistory.some((spin) => {
      const spunAt = new Date(spin?.spunAt || "");
      return (
        Number.isFinite(spunAt.getTime()) &&
        getIndiaDrawCycle(spunAt) === currentCycle
      );
    });
    const manualDrawCompleted =
      featureSettings.manualDrawCompleted === true || hasWinnerForCurrentCycle;
    return response.json({
      wheelEnabled,
      showWheel: wheelEnabled,
      isDrawing,
      drawingWinner,
      ...featureSettings,
      manualDrawCompleted,
      hasWinnerForCurrentCycle,
      drawCountYear,
      drawCountsByMonth,
      lastSpin,
      entries: eligibleCustomers.map((customer, index) => ({
        id: String(index),
        name: customer.Name,
        celebrationDate:
          customer["Celebration date"] ||
          customer["Date of birth"] ||
          "",
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function luckyDrawLatestWinner(request, response, next) {
  try {
    const [wheelEnabled, winnerHistory] = await Promise.all([
      getLuckyDrawWheelEnabled(),
      getLuckyDrawWinnerHistory(),
    ]);
    const latestWinner = winnerHistory
      .filter(
        (spin) =>
          spin?.winner && Number.isFinite(Date.parse(spin.spunAt || "")),
      )
      .sort(
        (first, second) =>
          Date.parse(second.spunAt) - Date.parse(first.spunAt),
      )[0];
    const latestWinnerDate = latestWinner
      ? new Date(latestWinner.spunAt)
      : null;

    return response.json({
      wheelEnabled,
      winner: latestWinner?.winner || null,
      lastWinnerName:
        latestWinner?.winner?.Name ||
        latestWinner?.winner?.name ||
        "",
      lastWinnerMonth: latestWinnerDate
        ? new Intl.DateTimeFormat("en-IN", {
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }).format(latestWinnerDate)
        : "",
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
        eventDate:
          spin.winner["Celebration date"] ||
          spin.winner["Date of birth"] ||
          spin.winner.date ||
          spin.winner.dob ||
          null,
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

    const celebrationMonth = Number(request.body?.celebrationMonth);
    if (
      !Number.isInteger(celebrationMonth) ||
      celebrationMonth < 1 ||
      celebrationMonth > 12
    ) {
      return response
        .status(400)
        .json({ message: "Choose a valid celebration month before spinning." });
    }

    const isRespin = Boolean(request.body?.respin || request.body?.isRespin);
    const lockKey = getIndiaDrawCycle();
    const draw = await withLuckyDrawCycleLock(lockKey, async () => {
      const featureSettings = await getLuckyDrawFeatureSettings();

      if (featureSettings.manualDrawCompleted === true && !isRespin) {
        return {
          error: "This month's lucky draw already has a winner. Use Re-spin to select another winner.",
          status: 409,
        };
      }

      const customers = await readLuckyDrawCustomers();
      const winnerHistory = await getLuckyDrawWinnerHistory();
      const hasWinnerForCurrentCycle = winnerHistory.some((spin) => {
        const spunAt = new Date(spin?.spunAt || "");
        return (
          Number.isFinite(spunAt.getTime()) &&
          getIndiaDrawCycle(spunAt) === lockKey
        );
      });
      if (hasWinnerForCurrentCycle && !isRespin) {
        return {
          error: "This month's lucky draw already has a winner. Use Re-spin to select another winner.",
          status: 409,
        };
      }

      const eligibleCustomers = getEligibleLuckyDrawCustomers(
        customers,
        winnerHistory,
        featureSettings.previousWinnerExclusionEnabled,
        {
          includeAllEntries: featureSettings.includeAllEntriesNextDraw,
          includeAllThisMonthEntries:
            featureSettings.includeAllThisMonthEntriesNextDraw,
          entriesMonth: featureSettings.includeAllThisMonthEntriesMonth,
          celebrationMonth,
        },
      );
      if (!eligibleCustomers.length) {
        return {
          error: "No eligible customers have a celebration in the selected month.",
          status: 400,
        };
      }

      const winner =
        eligibleCustomers[Math.floor(Math.random() * eligibleCustomers.length)];
      const lastSpin = await recordLuckyDrawSpin(winner, { isRespin });
      await setLuckyDrawManualDrawCompleted();
      await setLuckyDrawSpinningState(true, winner);
      if (
        featureSettings.includeAllEntriesNextDraw ||
        featureSettings.includeAllThisMonthEntriesNextDraw
      ) {
        await clearLuckyDrawNextDrawEligibilityOptions();
      }
      return {
        winner,
        spinId: lastSpin.id,
        isRespin,
        includeAllEntriesNextDraw: false,
        includeAllThisMonthEntriesNextDraw: false,
      };
    });

    if (!draw.acquired) {
      return response.status(409).json({
        message: "A lucky draw is already in progress. Please try again.",
      });
    }
    if (draw.value.error) {
      return response
        .status(draw.value.status)
        .json({ message: draw.value.error });
    }

    const whatsapp = await notifyLuckyDrawWinner(draw.value.winner);
    return response.json({ ...draw.value, whatsapp });
  } catch (error) {
    if (error.code === "DUPLICATE_LUCKY_DRAW_CYCLE") {
      return response.status(409).json({ message: error.message });
    }
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

export async function setLuckyDrawIncludeAllEntriesNextDraw(
  request,
  response,
  next,
) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }
    if (typeof request.body?.enabled !== "boolean") {
      return response.status(400).json({
        message: "Choose whether to include all entries in the next draw.",
      });
    }

    const lockKey = getIndiaDrawCycle();
    const update = await withLuckyDrawCycleLock(lockKey, async () => {
      return {
        includeAllEntriesNextDraw:
          await saveIncludeAllEntriesNextDraw(request.body.enabled),
      };
    });

    if (!update.acquired) {
      return response.status(409).json({
        message: "A lucky draw is in progress. Try changing eligibility again.",
      });
    }
    return response.json(update.value);
  } catch (error) {
    return next(error);
  }
}

export async function setLuckyDrawIncludeAllThisMonthEntriesNextDraw(
  request,
  response,
  next,
) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }
    if (typeof request.body?.enabled !== "boolean") {
      return response.status(400).json({
        message: "Choose whether to include all entries submitted this month.",
      });
    }

    const lockKey = getIndiaDrawCycle();
    const update = await withLuckyDrawCycleLock(lockKey, async () => {
      return saveIncludeAllThisMonthEntriesNextDraw(
        request.body.enabled,
      );
    });

    if (!update.acquired) {
      return response.status(409).json({
        message: "A lucky draw is in progress. Try changing eligibility again.",
      });
    }
    return response.json(update.value);
  } catch (error) {
    return next(error);
  }
}

export async function updateLuckyDrawFeatures(request, response, next) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }

    const {
      annualEligibilityEnabled,
      previousWinnerExclusionEnabled,
    } = request.body || {};
    if (
      typeof annualEligibilityEnabled !== "boolean" ||
      typeof previousWinnerExclusionEnabled !== "boolean"
    ) {
      return response.status(400).json({
        message: "Set both eligibility options.",
      });
    }

    const settings = await setLuckyDrawFeatureSettings({
      annualEligibilityEnabled,
      previousWinnerExclusionEnabled,
    });
    return response.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function updateLuckyDrawOccasions(request, response, next) {
  try {
    if (!isAdminToken(request.get("authorization")?.replace("Bearer ", ""))) {
      return response.status(401).json({ message: "Admin access is required" });
    }

    const occasions = request.body?.celebrationOccasions;
    if (
      !Array.isArray(occasions) ||
      occasions.length < 1 ||
      occasions.length > 20 ||
      occasions.some(
        (occasion) =>
          typeof occasion !== "string" ||
          !occasion.trim() ||
          occasion.trim().length > 40,
      )
    ) {
      return response.status(400).json({
        message: "Add between 1 and 20 occasion names, up to 40 characters each.",
      });
    }

    const normalizedOccasions = occasions.map((occasion) => occasion.trim());
    const normalizedNames = normalizedOccasions.map((occasion) =>
      occasion.toLocaleLowerCase(),
    );
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      return response.status(400).json({
        message: "Occasion names must be unique.",
      });
    }

    const celebrationOccasions =
      await setLuckyDrawCelebrationOccasions(normalizedOccasions);
    return response.json({ celebrationOccasions });
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

function compareCustomersNewestFirst(first, second) {
  const firstSubmittedAt = Date.parse(
    first["Submitted at"] || first.submittedAt || "",
  );
  const secondSubmittedAt = Date.parse(
    second["Submitted at"] || second.submittedAt || "",
  );
  const firstTimestamp = Number.isFinite(firstSubmittedAt)
    ? firstSubmittedAt
    : Number.NEGATIVE_INFINITY;
  const secondTimestamp = Number.isFinite(secondSubmittedAt)
    ? secondSubmittedAt
    : Number.NEGATIVE_INFINITY;

  if (firstTimestamp !== secondTimestamp) {
    return secondTimestamp - firstTimestamp;
  }

  const firstId = Number(first.id);
  const secondId = Number(second.id);
  if (Number.isFinite(firstId) && Number.isFinite(secondId)) {
    return secondId - firstId;
  }
  return String(second.id || "").localeCompare(String(first.id || ""), "en", {
    numeric: true,
  });
}

export async function listLuckyDrawCustomers(request, response, next) {
  try {
    if (!requireAdmin(request, response)) return;
    const customers = (await readLuckyDrawCustomers()).sort(
      compareCustomersNewestFirst,
    );
    return response.json({ customers });
  } catch (error) {
    return next(error);
  }
}

export async function updateLuckyDrawCustomer(request, response, next) {
  try {
    if (!requireAdmin(request, response)) return;
    const customerId = request.params.customerId;
    const {
      name,
      phone,
      occasion,
      celebrationDate,
      dob,
      guests,
      consent,
      submittedAt,
    } = request.body || {};
    if (
      !/^[1-9][0-9]*$/.test(customerId) ||
      !name?.trim() ||
      !/^[0-9]{10}$/.test(phone || "") ||
      typeof occasion !== "string" ||
      !occasion.trim() ||
      !isValidDrawDate(celebrationDate) ||
      !isValidDrawDate(dob) ||
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1 ||
      !["Yes", "No"].includes(consent) ||
      !Number.isFinite(new Date(submittedAt).getTime())
    ) {
      return response
        .status(400)
        .json({ message: "Enter valid customer details" });
    }

    const customer = await updateCustomerRecord(customerId, {
      name: name.trim(),
      phone,
      occasion: occasion.trim(),
      celebrationDate,
      dob,
      guests: Number(guests),
      consent,
      submittedAt,
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

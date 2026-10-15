import { normalizePhone } from "../utils/normalizePhone.js";

const oneYearInMs = 365 * 24 * 60 * 60 * 1000;

function isWithinOneYear(date, now = Date.now()) {
  const timestamp = Date.parse(date);
  return (
    Number.isFinite(timestamp) &&
    timestamp >= now - oneYearInMs &&
    timestamp <= now
  );
}

function getCustomerCelebrationMonth(customer) {
  const celebrationDate =
    customer["Celebration date"] || customer["Date of birth"] || "";
  return String(celebrationDate).match(/^\d{4}-\d{2}/)?.[0] || "";
}

export function getEligibleLuckyDrawCustomers(
  customers,
  winnerHistory,
  previousWinnerExclusionEnabled,
  {
    includeAllEntries = false,
    includeAllThisMonthEntries = false,
    entriesMonth = "",
  } = {},
) {
  const recentWinners =
    previousWinnerExclusionEnabled && !includeAllEntries
    ? new Set(
        winnerHistory
          .filter((spin) => isWithinOneYear(spin.spunAt))
          .map((spin) =>
            normalizePhone(spin.winner?.Phone || spin.winner?.phone),
          )
          .filter(Boolean),
      )
    : new Set();

  let eligibleEntries;
  if (includeAllThisMonthEntries) {
    const monthlyCustomers = customers.filter(
      (customer) => getCustomerCelebrationMonth(customer) === entriesMonth,
    );
    const latestCustomerByPhone = new Map();
    const customersWithoutPhone = [];
    for (const customer of monthlyCustomers) {
      const phone = normalizePhone(customer.Phone || customer.phone);
      if (phone) {
        latestCustomerByPhone.set(phone, customer);
      } else {
        customersWithoutPhone.push(customer);
      }
    }
    return [...latestCustomerByPhone.values(), ...customersWithoutPhone];
  }

  const latestCustomerByPhone = new Map();
  const customersWithoutPhone = [];
  for (const customer of customers) {
    const phone = normalizePhone(customer.Phone || customer.phone);
    if (phone) {
      latestCustomerByPhone.set(phone, customer);
    } else {
      customersWithoutPhone.push(customer);
    }
  }
  eligibleEntries = [...latestCustomerByPhone.values(), ...customersWithoutPhone];

  return eligibleEntries.filter(
    (customer) =>
      !previousWinnerExclusionEnabled ||
      includeAllEntries ||
      !recentWinners.has(normalizePhone(customer.Phone || customer.phone)),
  );
}

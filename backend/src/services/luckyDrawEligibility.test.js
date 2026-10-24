import test from "node:test";
import assert from "node:assert/strict";
import { getEligibleLuckyDrawCustomers } from "./luckyDrawEligibility.js";

test("uses only current-month celebrations, one entry per customer, including recent winners", () => {
  const customers = [
    {
      Name: "First registration",
      Phone: "9876543210",
      "Celebration date": "2026-10-03",
      "Submitted at": "2026-09-29T09:00:00.000Z",
    },
    {
      Name: "Repeat registration",
      Phone: "9876543210",
      "Celebration date": "2026-10-09",
      "Submitted at": "2026-10-09T09:00:00.000Z",
    },
    {
      Name: "Recent winner",
      Phone: "9123456780",
      "Celebration date": "2026-10-08",
      "Submitted at": "2026-10-08T09:00:00.000Z",
    },
    {
      Name: "Previous month",
      Phone: "9123456781",
      "Celebration date": "2026-09-30",
      "Submitted at": "2026-10-10T09:00:00.000Z",
    },
    {
      Name: "Repeat customer without phone",
      "Celebration date": "2026-10-10",
    },
    {
      Name: "Another entry without phone",
      "Celebration date": "2026-10-11",
    },
  ];
  const winnerHistory = [
    {
      winner: { Phone: "9123456780" },
      spunAt: "2026-06-01T09:00:00.000Z",
    },
  ];

  const entries = getEligibleLuckyDrawCustomers(
    customers,
    winnerHistory,
    true,
    {
      includeAllThisMonthEntries: true,
      entriesMonth: "2026-10",
    },
  );

  assert.deepEqual(entries.map(({ Name }) => Name), [
    "Repeat registration",
    "Recent winner",
    "Repeat customer without phone",
    "Another entry without phone",
  ]);
});

test("the next-draw reset can include recent winners with monthly entries", () => {
  const customers = [
    {
      Name: "Recent winner",
      Phone: "9123456780",
      "Celebration date": "2026-10-08",
      "Submitted at": "2026-10-08T09:00:00.000Z",
    },
    {
      Name: "Other entry",
      Phone: "9876543210",
      "Celebration date": "2026-10-09",
      "Submitted at": "2026-10-09T09:00:00.000Z",
    },
  ];
  const winnerHistory = [
    {
      winner: { Phone: "9123456780" },
      spunAt: "2026-06-01T09:00:00.000Z",
    },
  ];

  const entries = getEligibleLuckyDrawCustomers(
    customers,
    winnerHistory,
    true,
    {
      includeAllEntries: true,
      includeAllThisMonthEntries: true,
      entriesMonth: "2026-10",
    },
  );

  assert.equal(entries.length, 2);
});

test("keeps the default one-entry-per-customer eligibility behavior", () => {
  const customers = [
    {
      Name: "Earlier registration",
      Phone: "9876543210",
      "Submitted at": "2026-10-03T09:00:00.000Z",
    },
    {
      Name: "Latest registration",
      Phone: "9876543210",
      "Submitted at": "2026-10-09T09:00:00.000Z",
    },
  ];

  const entries = getEligibleLuckyDrawCustomers(customers, [], true);

  assert.deepEqual(
    entries.map(({ Name }) => Name),
    ["Latest registration"],
  );
});

test("limits spin eligibility to the selected celebration month across years", () => {
  const customers = [
    { Name: "October entry", Phone: "9876543210", "Celebration date": "2026-10-03" },
    { Name: "November entry", Phone: "9876543211", "Celebration date": "2026-11-03" },
    { Name: "October last year", Phone: "9876543212", "Celebration date": "2025-10-03" },
  ];

  const entries = getEligibleLuckyDrawCustomers(
    customers,
    [],
    false,
    { celebrationMonth: 10 },
  );

  assert.deepEqual(
    entries.map(({ Name }) => Name),
    ["October entry", "October last year"],
  );
});

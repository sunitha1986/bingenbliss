import test from "node:test";
import assert from "node:assert/strict";
import { getIndiaDrawCountsByMonth } from "./indiaDate.js";

test("counts spins by India calendar month for the current India year", () => {
  const { year, counts } = getIndiaDrawCountsByMonth(
    [
      { spunAt: "2026-10-01T00:00:00.000Z" },
      { spunAt: "2026-10-31T18:45:00.000Z" },
      { spunAt: "2026-11-01T00:00:00.000Z" },
      { spunAt: "2025-10-15T10:00:00.000Z" },
      { spunAt: "invalid" },
    ],
    new Date("2026-10-16T10:00:00.000Z"),
  );

  assert.equal(year, 2026);
  assert.deepEqual(counts, { 10: 1, 11: 2 });
});

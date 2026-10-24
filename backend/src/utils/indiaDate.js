const indiaTimeZone = "Asia/Kolkata";

const indiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: indiaTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getIndiaDateParts(date = new Date()) {
  const parts = Object.fromEntries(
    indiaDateFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );

  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getIndiaDrawCycle(date = new Date()) {
  const { year, month } = getIndiaDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getIndiaDrawCountsByMonth(spins, now = new Date()) {
  const { year } = getIndiaDateParts(now);
  const counts = {};

  for (const spin of spins) {
    const spunAt = new Date(spin?.spunAt || "");
    if (!Number.isFinite(spunAt.getTime())) continue;

    const parts = getIndiaDateParts(spunAt);
    if (parts.year === year) {
      counts[parts.month] = (counts[parts.month] || 0) + 1;
    }
  }

  return { year, counts };
}

export function getIndiaDrawDate(date = new Date()) {
  const { year, month, day } = getIndiaDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

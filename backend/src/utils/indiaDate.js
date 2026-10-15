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

export function getIndiaDrawDate(date = new Date()) {
  const { year, month, day } = getIndiaDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

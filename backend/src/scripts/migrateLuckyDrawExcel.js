import "../config/loadEnv.js";
import { readLuckyDrawCustomers } from "../config/luckyDrawExcel.js";
import {
  closeLuckyDrawDatabase,
  importLegacyLuckyDrawCustomers,
} from "../config/luckyDrawDatabase.js";

function normalizeExcelDate(value) {
  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400000))
      .toISOString()
      .slice(0, 10);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError(`Invalid date found in workbook: ${value}`);
  }
  return date.toISOString().slice(0, 10);
}

function normalizeExcelDateTime(value) {
  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400000)).toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError(`Invalid submission time found in workbook: ${value}`);
  }
  return date.toISOString();
}

try {
  const customers = await readLuckyDrawCustomers();
  const normalizedCustomers = customers.map((customer) => {
    const dateOfBirth = normalizeExcelDate(
      customer["Date of birth"] || customer["Celebration date"],
    );
    return {
      ...customer,
      Phone: String(customer.Phone || "").replace(/\D/g, ""),
      "Date of birth": dateOfBirth,
      "Celebration date": normalizeExcelDate(
        customer["Celebration date"] || dateOfBirth,
      ),
      "Submitted at": normalizeExcelDateTime(customer["Submitted at"]),
    };
  });

  const imported = await importLegacyLuckyDrawCustomers(normalizedCustomers);
  console.log(`Imported ${imported} customer records into MySQL.`);
} catch (error) {
  console.error(`Workbook import failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeLuckyDrawDatabase();
}

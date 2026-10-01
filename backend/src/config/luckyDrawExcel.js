import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const currentFile = fileURLToPath(import.meta.url);
const dataDirectory = path.resolve(path.dirname(currentFile), "../../data");
const workbookFile = path.join(dataDirectory, "lucky-draw-customers.xlsx");
const customerHeaders = [
  "Name",
  "Phone",
  "Occasion",
  "Celebration date",
  "Date of birth",
  "Guests",
  "Consent",
  "Submitted at",
];

function writeWorkbook(workbook, workbookSheet, customers) {
  const worksheet = XLSX.utils.json_to_sheet(customers, {
    header: customerHeaders,
  });
  workbook.Sheets[workbookSheet] = worksheet;
  XLSX.writeFile(workbook, workbookFile);
}

export async function readLuckyDrawCustomers() {
  try {
    await fs.access(workbookFile);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const workbook = XLSX.readFile(workbookFile);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

export async function appendLuckyDrawCustomer(customer) {
  await fs.mkdir(dataDirectory, { recursive: true });

  let workbook;
  try {
    await fs.access(workbookFile);
    workbook = XLSX.readFile(workbookFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    workbook = XLSX.utils.book_new();
  }

  const sheetName = workbook.SheetNames[0] || "Customers";
  const existingCustomers = workbook.Sheets[sheetName]
    ? XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    : [];
  const customers = [...existingCustomers, customer];
  if (!workbook.Sheets[sheetName]) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(customers, { header: customerHeaders }),
      sheetName,
    );
  }

  try {
    writeWorkbook(workbook, sheetName, customers);
  } catch (error) {
    if (error.code === "EBUSY" || error.code === "EPERM") {
      const workbookError = new Error(
        "Close lucky-draw-customers.xlsx before submitting a new entry",
      );
      workbookError.statusCode = 409;
      throw workbookError;
    }
    throw error;
  }
  return customer;
}

export async function replaceLuckyDrawCustomers(customers) {
  await fs.mkdir(dataDirectory, { recursive: true });

  let workbook;
  try {
    await fs.access(workbookFile);
    workbook = XLSX.readFile(workbookFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    workbook = XLSX.utils.book_new();
  }

  const sheetName = workbook.SheetNames[0] || "Customers";
  if (!workbook.Sheets[sheetName]) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(customers, { header: customerHeaders }),
      sheetName,
    );
  }

  try {
    writeWorkbook(workbook, sheetName, customers);
  } catch (error) {
    if (error.code === "EBUSY" || error.code === "EPERM") {
      const workbookError = new Error(
        "Close lucky-draw-customers.xlsx before changing customer data",
      );
      workbookError.statusCode = 409;
      throw workbookError;
    }
    throw error;
  }
}

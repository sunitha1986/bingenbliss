import crypto from "node:crypto";

const adminEmail = process.env.ADMIN_EMAIL || "admin@bingenbliss.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminTokens = new Set();

export function createAdminToken(email, password) {
  if (
    email?.trim().toLowerCase() !== adminEmail ||
    password !== adminPassword
  ) {
    return null;
  }

  const token = crypto.randomUUID();
  adminTokens.add(token);
  return token;
}

export function isAdminToken(token) {
  return typeof token === "string" && adminTokens.has(token);
}

import crypto from "node:crypto";

const adminEmail = process.env.ADMIN_EMAIL || "admin@bingenbliss.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const testAdminEmail = "admin@bingenbliss.com";
const testAdminPassword = "admin123";
const tokenSecret = process.env.ADMIN_TOKEN_SECRET || adminPassword;
const tokenLifetimeSeconds = 12 * 60 * 60;

function sign(payload) {
  return crypto
    .createHmac("sha256", tokenSecret)
    .update(payload)
    .digest("base64url");
}

export function createAdminToken(email, password) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const isDevelopmentTestAdmin =
    process.env.NODE_ENV === "development" &&
    normalizedEmail === testAdminEmail &&
    password === testAdminPassword;

  if (
    !isDevelopmentTestAdmin &&
    (normalizedEmail !== adminEmail || password !== adminPassword)
  ) {
    return null;
  }

  const payload = Buffer.from(
    JSON.stringify({
      email: normalizedEmail,
      expiresAt: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function isAdminToken(token) {
  if (typeof token !== "string") return false;

  const [payload, signature, ...extra] = token.split(".");
  if (!payload || !signature || extra.length) return false;

  const expectedSignature = Buffer.from(sign(payload));
  const providedSignature = Buffer.from(signature);
  if (
    expectedSignature.length !== providedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return false;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    const isDevelopmentTestAdmin =
      process.env.NODE_ENV === "development" &&
      claims.email === testAdminEmail;
    return (
      (claims.email === adminEmail || isDevelopmentTestAdmin) &&
      Number.isInteger(claims.expiresAt) &&
      claims.expiresAt > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

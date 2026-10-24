import config from "../config.js";

async function request(path, options) {
  let response;
  const baseUrl = (config.API_BASE_URL || "").replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  try {
    response = await fetch(`${baseUrl}${normalizedPath}`, options);
  } catch {
    throw new Error(
      "Unable to reach the backend. Start the backend server and try again.",
    );
  }

  const responseText = await response.text();
  let result = {};
  if (responseText.trim()) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        `The server returned an unexpected response (${response.status}).`,
    );
  }
  if (!responseText.trim()) {
    throw new Error("The server returned an empty response.");
  }
  return result;
}

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function lookupCustomerRegistration(phone) {
  return request("/api/auth/customer-lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

export function verifyCustomerLogin(phone, code) {
  return request("/api/auth/customer-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
}

export function validateCoupon(payload) {
  return request("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createOrder(payload) {
  return request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createLuckyDrawEntry(payload) {
  return request("/api/lucky-draw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getLuckyDrawStatus() {
  return request("/api/lucky-draw/status").then((status) => {
    if (!Array.isArray(status.entries)) {
      throw new Error(
        "Lucky draw status is unavailable. Check that the backend is running and the frontend /api proxy is configured.",
      );
    }
    return status;
  });
}

export function getLuckyDrawLatestWinner() {
  return request("/api/lucky-draw/latest-winner");
}


export function getLuckyDrawWinners(token) {
  return request("/api/admin/lucky-draw/winners", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function adminLogin(payload) {
  return request("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function spinLuckyDraw(token, payload = {}) {
  return request("/api/admin/lucky-draw/spin", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function setLuckyDrawVisibility(token, enabled) {
  return request("/api/admin/lucky-draw/visibility", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
}

export function setLuckyDrawIncludeAllEntriesNextDraw(token, enabled) {
  return request("/api/admin/lucky-draw/eligibility-reset", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
}

export function setLuckyDrawIncludeAllThisMonthEntriesNextDraw(token, enabled) {
  return request("/api/admin/lucky-draw/include-this-month-entries", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
}

export function updateLuckyDrawFeatures(token, settings) {
  return request("/api/admin/lucky-draw/features", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
}

export function updateLuckyDrawOccasions(token, celebrationOccasions) {
  return request("/api/admin/lucky-draw/occasions", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ celebrationOccasions }),
  });
}

export function updateLuckyDrawNextDrawDate(token, nextDrawDate) {
  return request("/api/admin/lucky-draw/next-draw-date", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nextDrawDate }),
  });
}

export function getAdminCustomers(token) {
  return request("/api/admin/customers", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateAdminCustomer(token, customerId, customer) {
  return request(`/api/admin/customers/${customerId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customer),
  });
}

export function deleteAdminCustomer(token, customerId) {
  return request(`/api/admin/customers/${customerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, options);
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

export function login(email) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
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
  return request("/api/lucky-draw/status");
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

export function spinLuckyDraw(token) {
  return request("/api/admin/lucky-draw/spin", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
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

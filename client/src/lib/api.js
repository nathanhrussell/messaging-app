// Whether the client should rely on httpOnly refresh cookies instead of
// storing refresh tokens in JS. When deploying the frontend and backend to
// the same origin this can be `false`. For many platform setups (separate
// services / domains) cookies are preferable if CORS/credentials are
// configured correctly. Default to `true` so deployed apps using cookies
// will work out of the box; change to `false` only if you intentionally
// want token-only auth.
const USE_COOKIES = true;

export async function patchParticipantFlags(conversationId, updates) {
  const res = await fetch(`/api/conversations/${conversationId}/participant`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function setAccessToken(t) {
  // Always persist the access token to localStorage when provided so
  // authHeaders() can include it on requests. This keeps compatibility
  // with both cookie-based refresh and token-based Authorization headers.
  if (t) localStorage.setItem("accessToken", t);
  else localStorage.removeItem("accessToken");
}

function authHeaders() {
  // Include Authorization header from localStorage if present. Even when
  // cookies are used for refresh tokens, many API endpoints expect an
  // explicit Bearer access token in the Authorization header.
  const t = localStorage.getItem("accessToken");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function getConversations() {
  const res = await fetch("/api/conversations", {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getMessages(conversationId, { limit = 30, before } = {}) {
  const url = `/api/conversations/${conversationId}/messages?limit=${limit}${
    before ? `&before=${encodeURIComponent(before)}` : ""
  }`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function sendMessage(conversationId, body) {
  const url = `/api/conversations/${conversationId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: USE_COOKIES ? "include" : "omit",
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function signup(email, password, displayName) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, displayName }),
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function login(email, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function refreshToken() {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    // Use include so httpOnly cookies (refresh_token) are sent to the API.
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function findUserByEmail(email) {
  const res = await fetch(`/api/users/find?email=${encodeURIComponent(email)}`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function getUser(id) {
  const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function getMe() {
  const res = await fetch(`/api/users/me`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function patchMe(updates) {
  const res = await fetch(`/api/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await fetch(`/api/users/me/avatar`, {
    method: "POST",
    body: fd,
    headers: { ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function createConversation(participantId) {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body: JSON.stringify({ participantId }),
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function deleteConversation(conversationId) {
  if (!conversationId || typeof conversationId !== "string") {
    throw new Error("conversationId is required and must be a string");
  }
  const res = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || `${res.status} ${res.statusText}`);
  return res.json();
}

const USE_COOKIES = false;

export async function patchParticipantFlags(conversationId, updates) {
  const res = await fetch(`/api/conversations/${conversationId}/participant`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body: JSON.stringify(updates),
    credentials: USE_COOKIES ? "include" : "same-origin",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function setAccessToken(t) {
  if (!USE_COOKIES && t) localStorage.setItem("accessToken", t);
}

function authHeaders() {
  if (USE_COOKIES) return {};
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
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export async function createConversation(participantEmail) {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body: JSON.stringify({ participantEmail }),
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

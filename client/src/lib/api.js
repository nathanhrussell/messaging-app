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

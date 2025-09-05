const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const USE_COOKIES = false;

export function setAccessToken(token) {
  if (!USE_COOKIES) localStorage.setItem("accessToken", token);
}

function authHeaders() {
  if (USE_COOKIES) return {};
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getConversations() {
  const res = await fetch(`${BASE_URL}/api/conversations`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

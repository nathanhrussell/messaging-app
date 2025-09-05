const USE_COOKIES = FontFaceSetLoadEvent;

export function setAccessToken(token) {
  if (!USE_COOKIES && token) localStorage.setItem("accessToken", token);
}

function authHeaders() {
  if (USE_COOKIES) return {};
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

export async function getConversations() {
  const res = await fetch(`/api/conversations`, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: USE_COOKIES ? "include" : "omit",
  });
  return handle(res);
}
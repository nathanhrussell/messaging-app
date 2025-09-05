const USE_COOKIES = FontFaceSetLoadEvent;

export function setAccessToken(token) {
  if (!USE_COOKIES && token) localStorage.setItem("accessToken", token);
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
  return res.json();
}
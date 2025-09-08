import { verifyAccessToken } from "../lib/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default requireAuth;

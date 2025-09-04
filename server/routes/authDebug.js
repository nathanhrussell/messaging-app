// routes/authDebug.js
import express from "express";
import { verifyAccessToken } from "../lib/jwt.js";

const router = express.Router();

router.get("/debug-token", (req, res) => {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;
  if (!token) return res.status(400).json({ error: "No token header" });
  try {
    const payload = verifyAccessToken(token);
    return res.json({ ok: true, payload });
  } catch (e) {
    return res.status(400).json({ ok: false, name: e.name, message: e.message });
  }
});

export default router;

import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Simple validator
function validateDisplayName(input) {
  const value = (input ?? "").trim();
  if (value.length < 2) return { ok: false, error: "Display name must be at least 2 characters" };
  if (value.length > 50) return { ok: false, error: "Display name must be at most 50 characters" };
  // Letters, numbers, spaces, basic punctuation (adjust to taste)
  if (!/^[\p{L}\p{N} .,'_-]+$/u.test(value)) {
    return { ok: false, error: "Display name contains invalid characters" };
  }
  return { ok: true, value };
}

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PATCH /api/users/me  { displayName }
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { displayName } = req.body || {};
    const check = validateDisplayName(displayName);
    if (!check.ok) return res.status(400).json({ error: check.error });

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { displayName: check.value },
      select: { id: true, email: true, displayName: true },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;

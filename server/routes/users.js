import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function validateDisplayName(input) {
  if (input === undefined) return { ok: true, value: undefined };
  const value = String(input ?? "").trim();
  if (value.length < 2) return { ok: false, error: "Display name must be at least 2 characters" };
  if (value.length > 50) return { ok: false, error: "Display name must be at most 50 characters" };
  if (!/^[\p{L}\p{N} .,'_-]+$/u.test(value)) {
    return { ok: false, error: "Display name contains invalid characters" };
  }
  return { ok: true, value };
}

function stripHtml(s) {
  return String(s ?? "").replace(/<[^>]*>/g, "");
}

function validateBio(input) {
  if (input === undefined) return { ok: true, value: undefined }; // not provided
  const raw = stripHtml(input).trim(); // keep things simple; no HTML in bios
  if (raw.length === 0) return { ok: true, value: null }; // treat empty as null
  if (raw.length > 300) return { ok: false, error: "Bio must be at most 300 characters" };
  return { ok: true, value: raw };
}

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, displayName: true, bio: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PATCH /api/users/me  { displayName?, bio? }
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const dn = validateDisplayName(req.body?.displayName);
    if (!dn.ok) return res.status(400).json({ error: dn.error });

    const b = validateBio(req.body?.bio);
    if (!b.ok) return res.status(400).json({ error: b.error });

    if (dn.value === undefined && b.value === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const data = {};
    if (dn.value !== undefined) data.displayName = dn.value;
    if (b.value !== undefined) data.bio = b.value;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, displayName: true, bio: true },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;

import { Readable } from "node:stream";
import express from "express";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../db/prisma.js";

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

router.post("/me/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Upload buffer to Cloudinary via stream
    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chat-app/avatars",
            public_id: req.user.id, // keep one avatar per user (overwrites)
            overwrite: true,
            resource_type: "image",
            transformation: [
              // normalize to a square-ish avatar; tweak to taste
              { width: 256, height: 256, crop: "fill", gravity: "face:auto" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        Readable.from(req.file.buffer).pipe(stream);
      });

    const result = await uploadStream();
    if (!result?.secure_url) return res.status(500).json({ error: "Upload failed" });

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: result.secure_url },
      select: { id: true, email: true, displayName: true, bio: true, avatarUrl: true },
    });

    return res.status(200).json(updated);
  } catch (e) {
    const isSize = e?.message?.toLowerCase?.().includes("file too large");
    const isType = e?.message === "Invalid file type";
    if (isSize || isType) {
      return res
        .status(400)
        .json({ error: isSize ? "File too large (max 5MB)" : "Invalid file type" });
    }
    return res.status(500).json({ error: "Failed to upload avatar" });
  }
});

export default router;

import express from "express";
import prisma from "../db/prisma.js";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

router.get("/db-health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;

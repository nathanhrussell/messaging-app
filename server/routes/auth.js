/* eslint-disable import/no-unresolved */
import express from "express";
import bcrypt from "bcrypt";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "#jwt";
import prisma from "../db/prisma.js";

const router = express.Router();

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "email, password, displayName are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
      select: { id: true, email: true, displayName: true },
    });

    const access = signAccessToken({ sub: user.id });
    const refresh = signRefreshToken({ sub: user.id });

    res.cookie("refresh_token", refresh, refreshCookieOptions());
    return res.status(201).json({ accessToken: access, user });
  } catch (e) {
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const publicUser = { id: user.id, email: user.email, displayName: user.displayName };
    const access = signAccessToken({ sub: user.id });
    const refresh = signRefreshToken({ sub: user.id });

    res.cookie("refresh_token", refresh, refreshCookieOptions());
    return res.json({ accessToken: access, user: publicUser });
  } catch (e) {
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    const payload = verifyRefreshToken(token);

    const access = signAccessToken({ sub: payload.sub });
    const nextRefresh = signRefreshToken({ sub: payload.sub });
    res.cookie("refresh_token", nextRefresh, refreshCookieOptions());

    return res.json({ accessToken: access });
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
  return res.status(204).send();
});

export default router;

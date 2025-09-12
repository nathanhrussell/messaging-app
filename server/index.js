/* eslint-disable no-console */
import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import usersRouter from "./routes/users.js";

import config from "./config/index.js";
import prisma from "./db/prisma.js";
import { assertDbConnection } from "./db/health.js";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import conversationsRouter from "./routes/conversations.js";
import authDebug from "./routes/authDebug.js";
import { setupSocketIO } from "./socket/index.js";

const app = express();

// If running behind a proxy (Render/Heroku), enable trust proxy so `secure`
// cookie flag and client IPs work correctly.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// --- Global middleware (must come BEFORE routes that read req.body)
app.use(helmet());
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.CORS_ORIGIN_PROD
    : process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/conversations", conversationsRouter);
app.use("/api/auth", authDebug);

app.use(express.json({ limit: "1mb" })); // <-- move up
app.use(express.urlencoded({ extended: true })); // <-- move up
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- Routes
app.use("/", healthRouter);
app.use("/api/auth", authRouter); // <-- now after parsers
app.use("/api/users", usersRouter);

// --- Healthchecks
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Optional DB health endpoint
app.get("/db-health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// (Optional) serve static client during early dev
app.use(express.static("client"));

const server = http.createServer(app);
setupSocketIO(server);

// --- Boot + graceful shutdown
(async () => {
  try {
    await assertDbConnection();
    console.log("✅ Database connection OK");
    if (process.env.NODE_ENV !== "test") {
      server.listen(config.port, () => {
        const host = process.env.NODE_ENV === "production" ? "(production)" : "http://localhost";
        console.log(`🚀 Server listening on ${host}:${config.port}`);
      });
    }
  } catch (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  }
})();

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, async () => {
    try {
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  });
});

export default app;

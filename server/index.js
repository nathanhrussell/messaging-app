/* eslint-disable no-console */
import "dotenv/config";
import fs from "fs";
import path from "path";
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

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Logging: concise in dev, combined in prod
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- Routes
app.use("/", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/auth", authDebug);

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

// Serve static client if present. Prefer the production build in `client/dist`.
// Falls back to the `client` folder (useful during development or preview).
const clientDistPath = path.join(process.cwd(), "client", "dist");
const clientSrcPath = path.join(process.cwd(), "client");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // SPA fallback to index.html in the dist folder
  // Use middleware approach for Express v5 compatibility
  app.use((_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else if (fs.existsSync(clientSrcPath)) {
  app.use(express.static(clientSrcPath));
}

// --- Global error handler (should come after routes)
// Catches body-parser errors (payload too large) and malformed JSON
app.use((err, _req, res, next) => {
  // `next` is intentionally unused here but referenced to satisfy lint rules
  /* eslint-disable no-unused-expressions */
  next;
  /* eslint-enable no-unused-expressions */
  if (!err) return res.status(500).json({ error: "Unknown error" });

  // Payload too large
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({ error: "Payload too large" });
  }

  // Malformed JSON (SyntaxError thrown by body parser)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON" });
  }

  // Fallback: include stack trace in non-production for easier debugging
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err.stack || err);
  const payload = { error: err.message || "Internal server error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;
  return res.status(err.status || 500).json(payload);
});

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

/* eslint-disable no-console */
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";

import config from "./config/index.js"; // loads .env + validates
import prisma from "./db/prisma.js"; // Prisma singleton
import { assertDbConnection } from "./db/health.js";

import healthRouter from "./routes/health.js";

const app = express();

app.use("/", healthRouter);

// --- Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- Healthchecks
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Optional DB health endpoint (handy in dev/Render)
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

// --- Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.emit("server:welcome", { message: "Hello from server 👋" });

  socket.on("client:ping", (payload) => {
    console.log("Received client:ping", payload);
    socket.emit("server:pong", { ts: Date.now() });
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

// --- Boot + graceful shutdown
(async () => {
  try {
    await assertDbConnection();
    console.log("✅ Database connection OK");
    server.listen(config.port, () => {
      console.log(`🚀 Server listening on http://localhost:${config.port}`);
    });
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

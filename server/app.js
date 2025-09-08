import express from "express";
import authRoutes from "./routes/auth.js";
import conversationRoutes from "./routes/conversations.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);

// ...existing middleware and routes...
export default app;

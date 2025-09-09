import express from "express";
import authRoutes from "./routes/auth.js";
import conversationRoutes from "./routes/conversations.js";
import messagesRouter from "./routes/messages.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messagesRouter);

export default app;

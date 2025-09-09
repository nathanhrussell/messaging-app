import { Server } from "socket.io";
import { socketAuthMiddleware } from "./auth.js";
import { sendMessageToConversation } from "../services/messages.js";

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    // Join personal room
    socket.join(`user:${socket.user.id}`);
    // eslint-disable-next-line no-console
    console.log(`User ${socket.user.id} connected and joined room user:${socket.user.id}`);

    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("send_message", async ({ conversationId, body }, cb) => {
      try {
        const message = await sendMessageToConversation(socket.user.id, conversationId, body);
        io.to(`conversation:${conversationId}`).emit("message", message);
        // Optionally emit sidebar update event
        io.to(`user:${socket.user.id}`).emit("conversation:update", {
          conversationId,
          lastMessage: message,
          // TODO: Add unread count logic
        });
        if (cb) cb({ ok: true, message });
      } catch (err) {
        if (cb) cb({ ok: false, error: err.message });
      }
    });
  });

  return io;
}

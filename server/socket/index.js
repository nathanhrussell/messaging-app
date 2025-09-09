import { Server } from "socket.io";
import { socketAuthMiddleware } from "./auth.js";

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
  });

  return io;
}

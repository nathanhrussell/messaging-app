import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  if (socket) {
    socket.disconnect();
  }
  socket = io("/", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => console.log("[socket] connected", socket.id));
  socket.on("connect_error", (err) => console.error("[socket] error:", err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinConversation(conversationId) {
  if (!socket) return;
  socket.emit("join_conversation", conversationId);
}

export function sendMessageSocket(conversationId, body, cb) {
  if (!socket) return;
  socket.emit("send_message", { conversationId, body }, cb);
}

export default {
  connectSocket,
  disconnectSocket,
  joinConversation,
  sendMessageSocket,
};

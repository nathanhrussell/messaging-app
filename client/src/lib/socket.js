import { io } from "socket.io-client";

export const socket = io("/", {
  auth: { token: localStorage.getItem("accessToken") },
});

export function joinConversation(conversationId) {
  socket.emit("join_conversation", conversationId);
}

export function sendMessageSocket(conversationId, body, cb) {
  socket.emit("send_message", { conversationId, body }, cb);
}

socket.on("message", (msg) => {
  // TODO: Dispatch to message store or update UI
  // Example: window.dispatchEvent(new CustomEvent("socket:message", { detail: msg }));
});

socket.on("conversation:update", (data) => {
  // TODO: Update sidebar with last message/unread
  // Example: window.dispatchEvent(new CustomEvent("socket:conversationUpdate", { detail: data }));
});

socket.on("connect", () => console.log("[socket] connected", socket.id));
socket.on("connect_error", (err) => console.error("[socket] error:", err.message));

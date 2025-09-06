import { io } from "socket.io-client";

export const socket = io("/", {
  auth: { token: localStorage.getItem("accessToken") },
});

socket.on("connect", () => console.log("[socket] connected", socket.id));
socket.on("connect_error", (err) => console.error("[socket] error:", err.message));

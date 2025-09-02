const socket = io({ withCredentials: true });

socket.on("connect", () => {
  document.getElementById("status").textContent = "Socket connected ✓";
  socket.emit("client:ping", { ts: Date.now() });
});

socket.on("server:welcome", (data) => {
  console.log("server:welcome", data);
});

socket.on("server:pong", (data) => {
  console.log("server:pong", data);
});

import http from "http";
import { io } from "socket.io-client";
import request from "supertest";
import app from "../app.js";
import { setupSocketIO } from "../socket/index.js";

let server;
let address;

async function getOrCreateUser(email, password, displayName) {
  let res = await request(app).post("/api/auth/signup").send({ email, password, displayName });
  if (res.status === 409) {
    res = await request(app).post("/api/auth/login").send({ email, password });
  }
  return res.body;
}

describe("Socket.IO authentication", () => {
  let ioServer;
  let userToken;

  beforeAll((done) => {
    server = http.createServer(app);
    ioServer = setupSocketIO(server);
    server.listen(() => {
      address = server.address();
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    server.close(done);
  });

  beforeAll(async () => {
    const user = await getOrCreateUser("socketuser@example.com", "password123", "Socket User");
    userToken = user.accessToken;
  });

  it("accepts connection with valid JWT", (done) => {
    const socket = io(`http://localhost:${address.port}`, {
      auth: { token: userToken },
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => {
      socket.close();
      done();
    });
    socket.on("connect_error", (err) => {
      socket.close();
      done.fail(err.message);
    });
  });

  it("rejects connection with invalid JWT", (done) => {
    const socket = io(`http://localhost:${address.port}`, {
      auth: { token: "invalid.jwt.token" },
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => {
      socket.close();
      done.fail("Should not connect with invalid token");
    });
    socket.on("connect_error", (err) => {
      socket.close();
      expect(err.message).toMatch(/Authentication error/);
      done();
    });
  });

  it("rejects connection with no token", (done) => {
    const socket = io(`http://localhost:${address.port}`, {
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => {
      socket.close();
      done.fail("Should not connect without token");
    });
    socket.on("connect_error", (err) => {
      socket.close();
      expect(err.message).toMatch(/Authentication error/);
      done();
    });
  });
});

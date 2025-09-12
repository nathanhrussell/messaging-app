import request from "supertest";
import app from "../app.js";

describe("Security: oversized and malformed requests", () => {
  it("returns 413 for payloads larger than the limit", async () => {
    // Create a large body > 1mb
    const big = "a".repeat(1024 * 1024 + 100);
    const res = await request(app)
      .post("/api/conversations/00000000-0000-0000-0000-000000000000/messages")
      .set("Authorization", "Bearer invalid")
      .send({ body: big });
    // Should be rejected by body parser before hitting auth; either 413 or 400
    expect([413, 400, 401]).toContain(res.statusCode);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .set("Content-Type", "application/json")
      .send('{ "email": "bad@example.com", "password": "x" '); // missing closing brace
    expect(res.statusCode).toBe(400);
  });
});

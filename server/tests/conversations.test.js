// Basic test for PATCH /api/conversations/:id/participant
const request = require("supertest");
const app = require("../app"); // Adjust if your Express app is exported elsewhere
const db = require("../db"); // Adjust if your DB helper is elsewhere

describe("PATCH /api/conversations/:id/participant", () => {
  let conversationId;
  let userToken;

  beforeAll(async () => {
    // Setup: create user, conversation, participant
    // ...existing code for setup...
    // Assign conversationId and userToken
  });

  afterAll(async () => {
    // ...existing code for teardown...
  });

  it("updates isFavourite and isArchived flags", async () => {
    const res = await request(app)
      .patch(`/api/conversations/${conversationId}/participant`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ isFavourite: true, isArchived: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.isFavourite).toBe(true);
    expect(res.body.isArchived).toBe(true);
    // Optionally, check DB state
    // const participant = await db.Participant.findOne({ where: { ... } });
    // expect(participant.isFavourite).toBe(true);
  });
});

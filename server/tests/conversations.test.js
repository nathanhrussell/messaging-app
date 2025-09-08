import request from "supertest";
import app from "../index.js";
// import db from "../db.js"; // Uncomment and fix if you need DB access

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

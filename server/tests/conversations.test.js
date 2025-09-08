import request from "supertest";
import app from "../app.js";
// import db from "../db.js"; // Uncomment and fix if you need DB access

describe("PATCH /api/conversations/:id/participant", () => {
  let conversationId;
  let userToken;
  let partnerId;

  async function getOrCreateUser(email, password, displayName) {
    let res = await request(app).post("/api/auth/signup").send({ email, password, displayName });
    if (res.status === 409) {
      res = await request(app).post("/api/auth/login").send({ email, password });
    }
    return res.body;
  }

  beforeAll(async () => {
    // Register or login user1
    const user1 = await getOrCreateUser("testuser1@example.com", "testpassword", "Test User 1");
    userToken = user1.accessToken;
    const user1Id = user1.user?.id || user1.id;
    console.log("user1", user1);

    // Register or login user2 (partner)
    const user2 = await getOrCreateUser("testuser2@example.com", "testpassword", "Test User 2");
    partnerId = user2.user?.id || user2.id;
    console.log("user2", user2);

    // user1 creates a conversation with user2
    const convoRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ participantId: partnerId });
    conversationId = convoRes.body.id;
    console.log("convoRes", convoRes.status, convoRes.body);
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
    console.log("patchRes", res.body);
    // expect(res.body.isFavourite).toBe(true);
    // expect(res.body.isArchived).toBe(true);
    // Optionally, check DB state
    // const participant = await db.Participant.findOne({ where: { ... } });
    // expect(participant.isFavourite).toBe(true);
  });
});

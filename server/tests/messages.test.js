import request from "supertest";
import app from "../app.js";

describe("GET /api/conversations/:id/messages", () => {
  let userToken;
  let partnerId;
  let conversationId;

  async function getOrCreateUser(email, password, displayName) {
    let res = await request(app).post("/api/auth/signup").send({ email, password, displayName });
    if (res.status === 409) {
      res = await request(app).post("/api/auth/login").send({ email, password });
    }
    return res.body;
  }

  beforeAll(async () => {
    const user1 = await getOrCreateUser("msguser1@example.com", "testpassword", "Msg User 1");
    userToken = user1.accessToken;
    const user1Id = user1.user?.id || user1.id;

    const user2 = await getOrCreateUser("msguser2@example.com", "testpassword", "Msg User 2");
    partnerId = user2.user?.id || user2.id;

    const convoRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ participantId: partnerId });
    conversationId = convoRes.body.id;
  });

  it("returns messages for a conversation", async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 403 if not a participant", async () => {
    // TODO: Create a user who is not a participant and test
  });
});

import request from "supertest";
import app from "../app.js";

describe("Authorization / membership checks", () => {
  let convoOwnerToken;
  let otherToken;
  let otherId;
  let conversationId;

  async function getOrCreateUser(email, password, displayName) {
    let res = await request(app).post("/api/auth/signup").send({ email, password, displayName });
    if (res.status === 409) {
      res = await request(app).post("/api/auth/login").send({ email, password });
    }
    return res.body;
  }

  beforeAll(async () => {
    const owner = await getOrCreateUser("authowner@example.com", "testpassword", "Owner");
    convoOwnerToken = owner.accessToken;
    const other = await getOrCreateUser("authother@example.com", "testpassword", "Other");
    otherToken = other.accessToken;
    otherId = other.user?.id || other.id;

    const convoRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${convoOwnerToken}`)
      .send({ participantId: otherId });
    conversationId = convoRes.body.id;
  });

  it("prevents a non-participant from fetching messages", async () => {
    // create a user who is NOT part of the convo
    const outsider = await getOrCreateUser("outsider@example.com", "testpassword", "Outsider");
    const outsiderToken = outsider.accessToken;

    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(res.statusCode).toBe(403);
  });

  it("prevents a non-participant from sending messages", async () => {
    const outsider = await getOrCreateUser("outsider@example.com", "testpassword", "Outsider");
    const outsiderToken = outsider.accessToken;

    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ body: "Hi I'm not a member" });
    expect(res.statusCode).toBe(403);
  });
});

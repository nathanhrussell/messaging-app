import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createOrGetOneToOneConversation } from "../services/conversations.js";

const router = express.Router();

/**
 * POST /api/conversations
 * Body: { participantId: string }
 * Idempotent 1:1 create/find.
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const authUserId = req.user.id;
    const { participantId } = req.body || {};

    if (!participantId || typeof participantId !== "string") {
      return res.status(400).json({ error: "participantId is required." });
    }

    const convo = await createOrGetOneToOneConversation(authUserId, participantId);
    return res.status(200).json({ id: convo.id });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || "Internal Server Error" });
  }
});

export default router;

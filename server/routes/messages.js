import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMessagesForConversation } from "../services/messages.js";

const router = express.Router();

// GET /api/conversations/:id/messages?limit=30&before=2024-06-01T12:00:00Z
router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { limit = 30, before } = req.query;
    const userId = req.user.id;

    const messages = await getMessagesForConversation(userId, conversationId, {
      limit: Number(limit),
      before,
    });

    return res.json(messages);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to fetch messages" });
  }
});

export default router;

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMessagesForConversation, sendMessageToConversation } from "../services/messages.js";

const router = express.Router();

// GET /api/conversations/:id/messages?limit=30&before=2024-06-01T12:00:00Z
router.get("/:id/messages", requireAuth, async (req, res) => {
  console.log("=== MESSAGES ROUTE DEBUG ===");
  console.log("Route hit: GET /:id/messages");
  console.log("Params:", req.params);
  console.log("Query:", req.query);
  console.log("User:", req.user);

  try {
    const { id: conversationId } = req.params;
    const { limit = 30, before } = req.query;
    const userId = req.user.id;

    console.log("Calling getMessagesForConversation with:", {
      userId,
      conversationId,
      limit: Number(limit),
      before,
    });

    const messages = await getMessagesForConversation(userId, conversationId, {
      limit: Number(limit),
      before,
    });

    console.log("Messages returned:", messages);
    return res.json(messages);
  } catch (err) {
    console.error("Error in messages route:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to fetch messages" });
  }
});
// POST /api/conversations/:id/messages
router.post("/:id/messages", requireAuth, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { body } = req.body;
    const userId = req.user.id;

    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Message body is required." });
    }

    const message = await sendMessageToConversation(userId, conversationId, body.trim());
    return res.status(201).json(message);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    if (err.status) return res.status(err.status).json({ error: err.message });
    return res.status(500).json({ error: "Failed to send message." });
  }
});

export default router;

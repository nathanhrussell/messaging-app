import express from "express";
import auth, { requireAuth } from "../middleware/auth.js";
import {
  createOrGetOneToOneConversation,
  getConversationsForUser,
} from "../services/conversations.js";
import prisma from "../db/prisma.js";
import messagesRouter from "./messages.js"; // ← Add this import

const router = express.Router();

// ← Add this line to include the messages routes
router.use("/", messagesRouter);

// DELETE /api/conversations/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    // Only allow delete if user is a participant
    const convo = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!convo) return res.status(404).json({ error: "Conversation not found" });
    const isParticipant = convo.participants.some((p) => p.userId === userId);
    if (!isParticipant) return res.status(403).json({ error: "Forbidden" });
    await prisma.conversation.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/**
 * POST /api/conversations
 * Body: { participantId: string }
 * Idempotent 1:1 create/find.
 */

router.patch("/:id/participant", auth, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { isFavourite, isArchived } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (typeof isFavourite !== "undefined") {
      if (typeof isFavourite !== "boolean") {
        return res.status(400).json({ error: "`isFavourite` must be boolean." });
      }
      updates.isFavourite = isFavourite;
    }
    if (typeof isArchived !== "undefined") {
      if (typeof isArchived !== "boolean") {
        return res.status(400).json({ error: "`isArchived` must be boolean." });
      }
      updates.isArchived = isArchived;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Provide at least one flag to update." });
    }

    const participant = await prisma.participant.update({
      where: {
        userId_conversationId: { userId, conversationId },
      },
      data: updates,
      select: {
        conversationId: true,
        userId: true,
        isFavourite: true,
        isArchived: true,
        updatedAt: true,
      },
    });

    return res.json({ ok: true, participant });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Participant not found for this conversation." });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to update participant flags." });
  }
});

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const items = await getConversationsForUser(req.user.id, { limit });
    return res.json(items);
  } catch (err) {
    // console.error(err);
    return res.status(500).json({ error: "Failed to load conversations" });
  }
});

export default router;

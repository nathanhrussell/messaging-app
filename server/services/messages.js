import prisma from "../db/prisma.js";

// Fetch messages for a conversation, paginated, newest first
export async function getMessagesForConversation(
  userId,
  conversationId,
  { limit = 30, before } = {}
) {
  // Check user is a participant
  const participant = await prisma.participant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!participant) {
    const e = new Error("Not a participant");
    e.status = 403;
    throw e;
  }

  const where = { conversationId };
  if (before) {
    where.createdAt = { lt: new Date(before) };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(100, Number(limit))),
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
    },
  });

  return messages;
}

export async function sendMessageToConversation(userId, conversationId, body) {
  // Check user is a participant
  const participant = await prisma.participant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!participant) {
    const e = new Error("Not a participant");
    e.status = 403;
    throw e;
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body,
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
    },
  });

  return message;
}

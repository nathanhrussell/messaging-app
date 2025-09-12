import prisma from "../db/prisma.js";

/**
 * Resolve or create a 1:1 conversation between two *different* users.
 * Always returns the same conversation id for the same pair.
 */
export async function createOrGetOneToOneConversation(userIdA, userIdB) {
  if (!userIdA || !userIdB) {
    const e = new Error("Both user ids are required.");
    e.status = 400;
    throw e;
  }
  if (userIdA === userIdB) {
    const e = new Error("Cannot create a conversation with yourself.");
    e.status = 400;
    throw e;
  }

  // Ensure the other user exists (nice early error)
  const otherExists = await prisma.user.findUnique({
    where: { id: userIdB },
    select: { id: true },
  });
  if (!otherExists) {
    const e = new Error("Participant not found.");
    e.status = 404;
    throw e;
  }

  const [a, b] = [userIdA, userIdB].sort();
  const pairKey = `${a}:${b}`;

  // 1) Try fast path by pairKey
  const existing = await prisma.conversation.findUnique({
    where: { pairKey },
    select: { id: true },
  });
  if (existing) return existing;

  // 2) Create new 1:1 conversation with both participants
  try {
    const convo = await prisma.conversation.create({
      data: {
        isGroup: false,
        pairKey,
        participants: {
          create: [{ userId: a }, { userId: b }],
        },
      },
      select: { id: true },
    });
    return convo;
  } catch (err) {
    // Handle race on unique(pairKey)
    const isUniqueViolation =
      err?.code === "P2002" || /Unique constraint/i.test(err?.message || "");
    if (isUniqueViolation) {
      const winner = await prisma.conversation.findUnique({
        where: { pairKey },
        select: { id: true },
      });
      if (winner) return winner;
    }
    throw err;
  }
}

export async function getConversationsForUser(userId, { limit = 20 } = {}) {
  const rows = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: Math.max(1, Math.min(100, Number(limit))),
    select: {
      id: true,
      lastMessageAt: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
      participants: {
        select: {
          userId: true,
          isFavourite: true,
          isArchived: true,
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  return rows.map((c) => {
    const lastMessage = c.messages[0] || null;

    // current user’s row for flags
    const mine = c.participants.find((p) => p.userId === userId) || {
      isFavourite: false,
      isArchived: false,
    };

    // one-to-one partner (the other participant)
    const other = c.participants.find((p) => p.userId !== userId)?.user || {
      id: "",
      displayName: "Unknown",
      avatarUrl: null,
    };

    if (!other.avatarUrl) other.avatarUrl = "/avatar.svg";

    return {
      id: c.id,
      lastMessage,
      partner: other,
      myParticipant: {
        isFavourite: !!mine.isFavourite,
        isArchived: !!mine.isArchived,
      },
    };
  });
}

/**
 * Return true if the given userId is participant in the conversation
 */
export async function isParticipant(userId, conversationId) {
  const row = await prisma.participant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
    select: { id: true },
  });
  return !!row;
}

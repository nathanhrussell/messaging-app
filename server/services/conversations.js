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
  // 1) Fetch conversations + your participant row + partner (+ last message)
  const convos = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      lastMessageAt: true,
      participants: {
        select: {
          userId: true,
          isArchived: true,
          isFavourite: true,
          lastReadAt: true,
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  });

  // 2) Shape + compute unread counts (simple & clear; N+1 counts)
  const items = await Promise.all(
    convos.map(async (c) => {
      const me = c.participants.find((p) => p.userId === userId);
      const partner = c.participants.find((p) => p.userId !== userId);

      // last message
      const lastMessage = c.messages[0] || null;

      // unread: partner messages after my lastReadAt
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          createdAt: {
            gt: me?.lastReadAt ?? new Date(0),
          },
          senderId: {
            not: userId,
          },
        },
      });

      return {
        id: c.id,
        lastMessageAt: c.lastMessageAt,
        partner: partner
          ? {
              id: partner.user.id,
              displayName: partner.user.displayName,
              avatarUrl: partner.user.avatarUrl,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount,
        flags: {
          isArchived: !!me?.isArchived,
          isFavourite: !!me?.isFavourite,
        },
      };
    })
  );

  return items;
}

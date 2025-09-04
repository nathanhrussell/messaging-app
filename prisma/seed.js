import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Secret123!", 10);

  const userA = await prisma.user.upsert({
    where: { email: "usera@example.com" },
    update: {},
    create: {
      email: "usera@example.com",
      passwordHash,
      displayName: "User A",
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: "userb@example.com" },
    update: {},
    create: {
      email: "userb@example.com",
      passwordHash,
      displayName: "User B",
    },
  });

  const convo = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: userA.id }, { userId: userB.id }],
      },
      messages: {
        create: [
          { senderId: userA.id, body: "Hey B 👋" },
          { senderId: userB.id, body: "Hi A!" },
        ],
      },
      lastMessageAt: new Date(),
    },
  });

  console.log("Seeded users + conversation:", {
    userA: userA.id,
    userB: userB.id,
    convo: convo.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

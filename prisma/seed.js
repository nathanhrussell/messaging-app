import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash,
      displayName: "Alice",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash,
      displayName: "Bob",
    },
  });

  const convo = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: alice.id }, { userId: bob.id }],
      },
      messages: {
        create: [
          { senderId: alice.id, body: "Hey Bob 👋" },
          { senderId: bob.id, body: "Hi Alice!" },
        ],
      },
      lastMessageAt: new Date(),
    },
  });

  console.log("Seeded users + conversation:", { alice: alice.id, bob: bob.id, convo: convo.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

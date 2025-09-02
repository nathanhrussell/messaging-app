import prisma from "./prisma.js";

export async function assertDbConnection() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

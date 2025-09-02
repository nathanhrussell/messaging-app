import prisma from "./prisma.js";

async function assertDbConnection() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  return true;
}

export default assertDbConnection;

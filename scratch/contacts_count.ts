import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const total = await prisma.contact.count();
  const userId = "cmqav8tnn0000tahoebfdik6q";
  const userTotal = await prisma.contact.count({ where: { userId } });
  console.log("Total contacts in DB:", total);
  console.log("Total contacts for our user:", userTotal);
}

run().catch(console.error).finally(() => prisma.$disconnect());

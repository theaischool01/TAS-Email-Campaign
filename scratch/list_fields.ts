import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const fields = await prisma.contactCustomField.findMany({
    orderBy: { key: "asc" }
  });
  console.log("=== ALL CUSTOM FIELDS ===");
  for (const f of fields) {
    const valCount = await prisma.contactFieldValue.count({ where: { fieldId: f.id } });
    console.log(`Key: ${f.key} | DisplayName: ${f.displayName} | Type: ${f.type} | isArchived: ${f.isArchived} | Values Stored: ${valCount}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

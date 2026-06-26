import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function audit() {
  // 1. Find ALL custom fields with "state" in key or display name
  const allFields = await prisma.contactCustomField.findMany({
    select: {
      id: true,
      key: true,
      displayName: true,
      type: true,
      options: true,
      isArchived: true,
      isRequired: true,
      userId: true,
    },
  });

  const stateFields = allFields.filter(
    (f) =>
      f.key.toLowerCase().includes("state") ||
      f.displayName.toLowerCase().includes("state")
  );

  console.log("=== ALL CUSTOM FIELDS WITH 'state' ===");
  console.log(JSON.stringify(stateFields, null, 2));

  console.log("\n=== ALL CUSTOM FIELDS (complete list) ===");
  for (const f of allFields) {
    console.log(
      `  - key: "${f.key}", display: "${f.displayName}", type: ${f.type}, archived: ${f.isArchived}, options: ${f.options}`
    );
  }
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  const fields = await prisma.contactCustomField.findMany({
    where: { isArchived: false }
  });

  console.log("=== CARDINALITY AUDIT ===");
  for (const field of fields) {
    const values = await prisma.contactFieldValue.findMany({
      where: { fieldId: field.id }
    });

    if (values.length === 0) continue;

    const rawSet = new Set<string>();
    const normSet = new Set<string>();

    for (const v of values) {
      let strVal = "";
      if (field.type === "TEXT" || field.type === "DROPDOWN") {
        strVal = v.textValue || "";
      } else if (field.type === "NUMBER") {
        strVal = v.numberValue !== null ? String(v.numberValue) : "";
      } else if (field.type === "DATE") {
        strVal = v.dateValue !== null ? v.dateValue.toISOString() : "";
      } else if (field.type === "BOOLEAN") {
        strVal = v.booleanValue !== null ? String(v.booleanValue) : "";
      } else if (field.type === "MULTI_SELECT") {
        strVal = v.jsonValue !== null ? JSON.stringify(v.jsonValue) : "";
      }

      if (strVal !== "") {
        rawSet.add(strVal);
        normSet.add(normalize(strVal));
      }
    }

    console.log(`Field: ${field.key} | DisplayName: ${field.displayName} | Type: ${field.type}`);
    console.log(`  Populated: ${values.length}`);
    console.log(`  Raw Distinct: ${rawSet.size}`);
    console.log(`  Normalized Distinct: ${normSet.size}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

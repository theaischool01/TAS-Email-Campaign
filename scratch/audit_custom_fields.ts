import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const fields = await prisma.contactCustomField.findMany({
    where: { isArchived: false }
  });

  console.log("=== CUSTOM FIELD AUDIT ===");
  for (const field of fields) {
    const values = await prisma.contactFieldValue.findMany({
      where: { fieldId: field.id }
    });

    const populated = values.length;
    
    // Group values depending on type
    const valCounts: Record<string, number> = {};
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

      if (strVal) {
        valCounts[strVal] = (valCounts[strVal] || 0) + 1;
      }
    }

    const distinctCount = Object.keys(valCounts).length;
    const sorted = Object.entries(valCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    console.log(`\nKey: ${field.key}`);
    console.log(`DisplayName: ${field.displayName}`);
    console.log(`Type: ${field.type}`);
    console.log(`Populated: ${populated}`);
    console.log(`Distinct: ${distinctCount}`);
    console.log("Top Values:");
    sorted.forEach(([val, count]) => {
      console.log(`  - ${val}: ${count}`);
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

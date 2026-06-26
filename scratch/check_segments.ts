import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const segments = await prisma.segment.findMany();
  console.log("=== CHECKING SEGMENT CRITERIA ===");
  let found = false;
  for (const s of segments) {
    const criteriaStr = JSON.stringify(s.criteria);
    if (criteriaStr.includes("TS") || criteriaStr.includes("AP") || criteriaStr.includes("TN")) {
      console.log(`Segment "${s.name}" (ID: ${s.id}) contains state alias reference:`);
      console.log(criteriaStr);
      found = true;
    }
  }
  if (!found) {
    console.log("No segments contain references to 'TS', 'AP', or 'TN'.");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

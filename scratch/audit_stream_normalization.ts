import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ and /g, " & ")
    .trim();
}

async function run() {
  const streamField = await prisma.contactCustomField.findFirst({
    where: { key: "stream", isArchived: false }
  });

  if (!streamField) {
    console.error("Stream field not found!");
    return;
  }

  const values = await prisma.contactFieldValue.findMany({
    where: { fieldId: streamField.id }
  });

  console.log("=== STREAM NORMALIZATION AUDIT ===");
  console.log(`Raw Populated Values Count: ${values.length}`);

  const rawMap: Record<string, number> = {};
  const normMap: Record<string, { count: number; rawRepresentations: Set<string> }> = {};

  for (const v of values) {
    const rawVal = v.textValue || "";
    if (!rawVal) continue;

    rawMap[rawVal] = (rawMap[rawVal] || 0) + 1;

    const normVal = normalize(rawVal);
    if (!normMap[normVal]) {
      normMap[normVal] = { count: 0, rawRepresentations: new Set() };
    }
    normMap[normVal].count++;
    normMap[normVal].rawRepresentations.add(rawVal);
  }

  const rawDistinct = Object.keys(rawMap).length;
  const normDistinct = Object.keys(normMap).length;

  console.log(`Raw Distinct Count: ${rawDistinct}`);
  console.log(`Normalized Distinct Count: ${normDistinct}`);

  console.log("\nTop Normalized Clusters & Suggested Mappings:");
  const sortedNorm = Object.entries(normMap)
    .sort((a, b) => b[1].count - a[1].count);

  for (const [normVal, data] of sortedNorm) {
    if (data.rawRepresentations.size > 1) {
      console.log(`\nCluster: "${normVal}" (Total count: ${data.count})`);
      console.log(`Suggested Canonical Name: "${Array.from(data.rawRepresentations)[0]}"`);
      console.log("Raw representations:");
      data.rawRepresentations.forEach(r => {
        console.log(`  - "${r}" (count: ${rawMap[r]})`);
      });
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

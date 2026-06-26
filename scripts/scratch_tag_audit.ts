import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

async function main() {
  console.log("🔍 RUNNING DB FORENSIC TAG AUDIT...");

  const contacts = await prisma.contact.findMany({
    where: {
      tags: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      tags: true,
      userId: true,
    },
  });

  const contactsWithTags = contacts.filter((c: any) => c.tags && c.tags.trim() !== "");
  console.log(`Total contacts in database: ${await prisma.contact.count()}`);
  console.log(`Contacts with non-empty tags: ${contactsWithTags.length}`);

  const tagCounts: Record<string, number> = {};
  const caseSensitivityMap: Record<string, Set<string>> = {};
  let badFormatsCount = 0;
  const badFormatExamples: string[] = [];

  for (const contact of contactsWithTags) {
    const rawTags = contact.tags;
    
    // Check bad format: double commas, trailing spaces, trailing commas
    if (rawTags.includes(",,") || rawTags.startsWith(",") || rawTags.endsWith(",") || /\s,\s/.test(rawTags)) {
      badFormatsCount++;
      if (badFormatExamples.length < 5) {
        badFormatExamples.push(rawTags);
      }
    }

    const split = rawTags.split(",");
    for (const rawTag of split) {
      const trimmed = rawTag.trim();
      if (!trimmed) {
        badFormatsCount++;
        continue;
      }

      // Track case sensitivity matches
      const lower = trimmed.toLowerCase();
      if (!caseSensitivityMap[lower]) {
        caseSensitivityMap[lower] = new Set();
      }
      caseSensitivityMap[lower].add(trimmed);

      tagCounts[lower] = (tagCounts[lower] || 0) + 1;
    }
  }

  console.log(`\nUnique tag slugs identified (case-insensitive): ${Object.keys(tagCounts).length}`);
  console.log(`Unique tag names (case-insensitive counts):`);
  console.log(tagCounts);

  console.log(`\nBad formats detected (double commas, empty entries, trailing commas): ${badFormatsCount}`);
  if (badFormatExamples.length > 0) {
    console.log("Bad format examples:", badFormatExamples);
  }

  // Check case discrepancy sets (e.g., tags with multiple casings)
  console.log("\nCase sensitivity duplicates (e.g. same tag with multiple case representations):");
  let caseConflictFound = false;
  for (const [lower, casings] of Object.entries(caseSensitivityMap)) {
    if (casings.size > 1) {
      caseConflictFound = true;
      console.log(`  - Key: "${lower}" -> casing variations: ${JSON.stringify(Array.from(casings))}`);
    }
  }
  if (!caseConflictFound) {
    console.log("  No casing variations found (all tags match exactly case-wise).");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Phase 1.2: Fix malformed options in existing custom fields
 * Phase 2: Seed CRM system field pack
 */
async function main() {
  const userId = "cmqav8tnn0000tahoebfdik6q";

  console.log("=== PHASE 1.2: FIX MALFORMED DROPDOWN OPTIONS ===\n");

  // Find all DROPDOWN and MULTI_SELECT fields
  const dropdownFields = await prisma.contactCustomField.findMany({
    where: {
      userId,
      type: { in: ["DROPDOWN", "MULTI_SELECT"] },
    },
  });

  let fixedCount = 0;
  for (const field of dropdownFields) {
    if (!field.options) continue;
    const raw = field.options.trim();

    // Check if it's already valid JSON array
    if (raw.startsWith("[")) {
      try {
        JSON.parse(raw);
        console.log(`  ✅ "${field.displayName}" — already valid JSON`);
        continue;
      } catch (_) {
        // Malformed JSON, needs fix
      }
    }

    // Raw comma-separated string — convert to JSON array
    const options = raw.split(",").map(s => s.trim()).filter(Boolean);
    const jsonOptions = JSON.stringify(options);

    console.log(`  🔧 "${field.displayName}"`);
    console.log(`     BEFORE: ${raw}`);
    console.log(`     AFTER:  ${jsonOptions}`);

    await prisma.contactCustomField.update({
      where: { id: field.id },
      data: { options: jsonOptions },
    });
    fixedCount++;
  }
  console.log(`\n  Fixed ${fixedCount} field(s).\n`);

  // =============================
  // PHASE 2: SEED CRM FIELD PACK
  // =============================
  console.log("=== PHASE 2: CRM SYSTEM FIELD PACK ===\n");

  const fieldPack: Array<{
    key: string;
    displayName: string;
    type: string;
    options?: string[];
  }> = [
    // Dropdowns
    { key: "state", displayName: "State", type: "DROPDOWN", options: ["Telangana", "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Maharashtra", "Delhi", "Uttar Pradesh", "Gujarat", "Rajasthan", "Kerala", "West Bengal", "Punjab", "Haryana", "Bihar", "Madhya Pradesh", "Odisha", "Jharkhand", "Chhattisgarh", "Assam", "Goa"] },
    { key: "country", displayName: "Country", type: "DROPDOWN", options: ["India", "USA", "UK", "Canada", "Australia", "Germany", "Singapore", "UAE", "Other"] },
    { key: "qualification", displayName: "Qualification", type: "DROPDOWN", options: ["10th", "12th", "Diploma", "B.Tech", "B.Sc", "B.Com", "BBA", "BCA", "M.Tech", "M.Sc", "MBA", "MCA", "PhD", "Other"] },
    { key: "passout_year", displayName: "Passout Year", type: "DROPDOWN", options: ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028"] },

    // Text fields
    { key: "address", displayName: "Address", type: "TEXT" },
    { key: "college_university", displayName: "College / University", type: "TEXT" },
    { key: "stream_branch", displayName: "Stream / Branch", type: "TEXT" },
    { key: "city", displayName: "City", type: "TEXT" },
    { key: "referrer_name", displayName: "Referrer Name", type: "TEXT" },

    // Number fields
    { key: "cgpa", displayName: "CGPA", type: "NUMBER" },
    { key: "percentage", displayName: "Percentage", type: "NUMBER" },
    { key: "experience", displayName: "Experience", type: "NUMBER" },

    // Yes/No Dropdowns
    { key: "has_laptop", displayName: "Has Laptop", type: "DROPDOWN", options: ["Yes", "No"] },
    { key: "ready_to_relocate", displayName: "Ready To Relocate", type: "DROPDOWN", options: ["Yes", "No"] },
    { key: "ready_to_work_from_office", displayName: "Ready To Work From Office", type: "DROPDOWN", options: ["Yes", "No"] },
    { key: "hyderabad_candidate", displayName: "Hyderabad Candidate", type: "DROPDOWN", options: ["Yes", "No"] },
  ];

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  for (const def of fieldPack) {
    // Check if field with this key already exists
    const existing = await prisma.contactCustomField.findFirst({
      where: { userId, key: def.key },
    });

    if (existing) {
      // If it's a dropdown and we have a richer options set, update it
      if (def.options && (def.type === "DROPDOWN" || def.type === "MULTI_SELECT")) {
        const existingOptions = (() => {
          if (!existing.options) return [];
          try {
            const parsed = JSON.parse(existing.options);
            return Array.isArray(parsed) ? parsed : existing.options.split(",").map((s: string) => s.trim());
          } catch {
            return existing.options.split(",").map((s: string) => s.trim());
          }
        })();

        // Merge: keep existing options + add new ones
        const existingLower = new Set(existingOptions.map((o: string) => o.toLowerCase()));
        const merged = [...existingOptions];
        for (const opt of def.options) {
          if (!existingLower.has(opt.toLowerCase())) {
            merged.push(opt);
          }
        }

        if (merged.length > existingOptions.length) {
          await prisma.contactCustomField.update({
            where: { id: existing.id },
            data: { options: JSON.stringify(merged) },
          });
          console.log(`  🔄 UPDATED "${def.displayName}" — merged ${merged.length - existingOptions.length} new option(s)`);
          updatedCount++;
        } else {
          console.log(`  ⏩ SKIPPED "${def.displayName}" — already exists with key "${def.key}"`);
          skippedCount++;
        }
      } else {
        console.log(`  ⏩ SKIPPED "${def.displayName}" — already exists with key "${def.key}"`);
        skippedCount++;
      }
      continue;
    }

    // Also check by displayName (case-insensitive)
    const existingByName = await prisma.contactCustomField.findFirst({
      where: {
        userId,
        displayName: { equals: def.displayName, mode: "insensitive" },
      },
    });

    if (existingByName) {
      console.log(`  ⏩ SKIPPED "${def.displayName}" — already exists with key "${existingByName.key}"`);
      skippedCount++;
      continue;
    }

    // Create new field
    await prisma.contactCustomField.create({
      data: {
        userId,
        key: def.key,
        displayName: def.displayName,
        type: def.type,
        options: def.options ? JSON.stringify(def.options) : null,
        isRequired: false,
        displayOrder: 0,
      },
    });
    console.log(`  ✅ CREATED "${def.displayName}" (${def.type})`);
    createdCount++;
  }

  console.log(`\n  Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}\n`);

  // Final verification
  console.log("=== FINAL VERIFICATION ===\n");
  const allFields = await prisma.contactCustomField.findMany({
    where: { userId, isArchived: false },
    orderBy: { displayOrder: "asc" },
    select: { key: true, displayName: true, type: true, options: true },
  });

  for (const f of allFields) {
    let optionsPreview = "—";
    if (f.options) {
      try {
        const parsed = JSON.parse(f.options);
        optionsPreview = `[${parsed.length} options]`;
      } catch {
        optionsPreview = `⚠️ MALFORMED: ${f.options.substring(0, 40)}`;
      }
    }
    console.log(`  ${f.type.padEnd(13)} | ${f.displayName.padEnd(30)} | ${f.key.padEnd(35)} | ${optionsPreview}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

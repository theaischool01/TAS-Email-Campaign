import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  const userId = "cmqav8tnn0000tahoebfdik6q";

  // =============================
  // 1. Archive duplicate State field
  // =============================
  console.log("=== TASK 1: Archive duplicate State field ===\n");

  const legacyField = await prisma.contactCustomField.findFirst({
    where: { userId, key: "test_launch_custom_state" },
  });

  if (legacyField) {
    console.log(`  BEFORE: "${legacyField.displayName}" (key: ${legacyField.key})`);
    console.log(`    isArchived: ${legacyField.isArchived}`);
    console.log(`    type: ${legacyField.type}`);

    const valueCount = await prisma.contactFieldValue.count({
      where: { fieldId: legacyField.id },
    });
    console.log(`    stored values: ${valueCount}`);

    await prisma.contactCustomField.update({
      where: { id: legacyField.id },
      data: { isArchived: true },
    });

    const updated = await prisma.contactCustomField.findUnique({
      where: { id: legacyField.id },
    });
    console.log(`  AFTER:  isArchived = ${updated!.isArchived} ✅`);
  } else {
    console.log("  Field not found (already removed?)");
  }

  // =============================
  // 2. Clean State dropdown options
  // =============================
  console.log("\n=== TASK 2: Clean State dropdown options ===\n");

  const stateField = await prisma.contactCustomField.findFirst({
    where: { userId, key: "state", type: "DROPDOWN" },
  });

  if (stateField) {
    const currentOptions: string[] = JSON.parse(stateField.options || "[]");
    console.log(`  BEFORE: ${currentOptions.length} options`);
    console.log(`  ${JSON.stringify(currentOptions)}`);

    // Remove alias codes TS, AP, TN
    const aliasesToRemove = new Set(["TS", "AP", "TN"]);
    const cleanedOptions = currentOptions.filter(opt => !aliasesToRemove.has(opt));

    console.log(`\n  AFTER:  ${cleanedOptions.length} options`);
    console.log(`  ${JSON.stringify(cleanedOptions)}`);
    console.log(`  Removed: ${[...aliasesToRemove].filter(a => currentOptions.includes(a)).join(", ")}`);

    await prisma.contactCustomField.update({
      where: { id: stateField.id },
      data: { options: JSON.stringify(cleanedOptions) },
    });
    console.log("  ✅ Updated");
  }

  // =============================
  // 3. Verify Ultimate Dataset
  // =============================
  console.log("\n=== TASK 3: Ultimate Dataset Size Check ===\n");

  const testList = await prisma.contactList.findFirst({
    where: { ownerId: userId, name: { contains: "Ultimate" } },
  });

  if (testList) {
    const memberCount = await prisma.contactListMember.count({
      where: { contactListId: testList.id },
    });
    console.log(`  List: "${testList.name}" (ID: ${testList.id})`);
    console.log(`  Current members: ${memberCount}`);
  } else {
    console.log("  No 'Ultimate' list found yet.");
  }

  const totalContacts = await prisma.contact.count({ where: { userId } });
  const totalLists = await prisma.contactList.count({ where: { ownerId: userId } });
  const activeFields = await prisma.contactCustomField.count({ where: { userId, isArchived: false } });
  const archivedFields = await prisma.contactCustomField.count({ where: { userId, isArchived: true } });

  console.log(`\n  Current state:`);
  console.log(`    Contacts:         ${totalContacts}`);
  console.log(`    Lists:            ${totalLists}`);
  console.log(`    Active fields:    ${activeFields}`);
  console.log(`    Archived fields:  ${archivedFields}`);

  console.log("\n=== ALL CLEANUP COMPLETE ===");
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

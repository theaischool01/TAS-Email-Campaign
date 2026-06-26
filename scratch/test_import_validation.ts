import { PrismaClient } from "@prisma/client";
import { ImportService } from "../lib/services/import-service";

const prisma = new PrismaClient();

async function runImportValidation() {
  const userId = "cmqav8tnn0000tahoebfdik6q";
  console.log("=== PHASE 3: IMPORT VALIDATION ===\n");

  // 1. Pre-import counts
  const preContacts = await prisma.contact.count({ where: { userId } });
  console.log(`Pre-import contact count: ${preContacts}`);

  // 2. Get the State custom field
  const stateField = await prisma.contactCustomField.findFirst({
    where: { userId, key: "state", type: "DROPDOWN" },
  });
  if (!stateField) {
    console.error("❌ State DROPDOWN field not found!");
    return;
  }
  console.log(`State field ID: ${stateField.id}`);
  console.log(`State options: ${stateField.options}\n`);

  // 3. Create a test list
  let testList = await prisma.contactList.findFirst({
    where: { name: "Import Validation Test", ownerId: userId },
  });
  if (!testList) {
    testList = await prisma.contactList.create({
      data: { name: "Import Validation Test", ownerId: userId },
    });
  }

  // 4. Prepare test rows with real Indian state names
  const testEmails = [
    "test_ts_import@example.com",
    "test_ap_import@example.com",
    "test_tn_import@example.com",
    "test_ka_import@example.com",
    "test_mh_import@example.com", // Maharashtra - not in original options, should be auto-created
  ];

  const rows = [
    { "Email": "test_ts_import@example.com", "First Name": "Ravi", "State": "Telangana" },
    { "Email": "test_ap_import@example.com", "First Name": "Sita", "State": "Andhra Pradesh" },
    { "Email": "test_tn_import@example.com", "First Name": "Kumar", "State": "Tamil Nadu" },
    { "Email": "test_ka_import@example.com", "First Name": "Priya", "State": "Karnataka" },
    { "Email": "test_mh_import@example.com", "First Name": "Amit", "State": "Maharashtra" },
  ];

  const mappings = {
    "Email": { action: "SYSTEM" as const, field: "email" },
    "First Name": { action: "SYSTEM" as const, field: "firstName" },
    "State": { action: "MAP_CUSTOM_FIELD" as const, fieldId: stateField.id },
  };

  // 5. Run import WITH autoCreateDropdownOptions
  console.log("--- Test A: Import with autoCreateDropdownOptions=true ---");
  const resultA = await ImportService.importContacts(
    userId,
    testList.id,
    rows,
    mappings,
    prisma,
    { autoCreateDropdownOptions: true }
  );

  console.log("Results:", resultA.results);
  console.log("Errors:", resultA.errors);

  // Verify all 5 contacts created
  const importedContacts = await prisma.contact.findMany({
    where: { userId, email: { in: testEmails } },
    include: {
      customFieldValues: {
        where: { fieldId: stateField.id },
      },
    },
  });

  console.log("\n--- Imported Contact Values ---");
  for (const c of importedContacts) {
    const stateVal = c.customFieldValues[0]?.textValue || "NULL";
    console.log(`  ${c.email} → state = "${stateVal}"`);
  }

  // 6. Verify duplicate handling — re-import same rows
  console.log("\n--- Test B: Re-import same rows (duplicate test) ---");
  const resultB = await ImportService.importContacts(
    userId,
    testList.id,
    rows,
    mappings,
    prisma,
    { autoCreateDropdownOptions: true }
  );
  console.log("Results:", resultB.results);
  console.log("Expected: alreadyInList=5, newContactsCreated=0");

  // 7. Verify dashboard count
  const postContacts = await prisma.contact.count({ where: { userId } });
  const listMembers = await prisma.contactListMember.count({
    where: { contactListId: testList.id },
  });
  console.log(`\n--- Count Verification ---`);
  console.log(`  Pre-import contacts: ${preContacts}`);
  console.log(`  Post-import contacts: ${postContacts}`);
  console.log(`  New contacts added: ${postContacts - preContacts}`);
  console.log(`  List members: ${listMembers}`);

  // 8. Verify auto-created options
  const updatedField = await prisma.contactCustomField.findUnique({
    where: { id: stateField.id },
  });
  const updatedOptions = JSON.parse(updatedField!.options || "[]");
  console.log(`\n--- State Field Options After Import ---`);
  console.log(`  Total options: ${updatedOptions.length}`);
  console.log(`  Options: ${JSON.stringify(updatedOptions)}`);

  // 9. Test WITHOUT autoCreateDropdownOptions (unknown value should fail)
  console.log("\n--- Test C: Import unknown state WITHOUT auto-create (should fail) ---");
  const resultC = await ImportService.importContacts(
    userId,
    testList.id,
    [{ "Email": "test_unknown@example.com", "State": "Narnia" }],
    mappings,
    prisma,
    { autoCreateDropdownOptions: false }
  );
  console.log("Results:", resultC.results);
  console.log("Errors:", resultC.errors);
  console.log("Expected: failed=1");

  // Cleanup test data
  console.log("\n--- Cleaning up test data ---");
  const allTestEmails = [...testEmails, "test_unknown@example.com"];
  const testContacts = await prisma.contact.findMany({
    where: { userId, email: { in: allTestEmails } },
    select: { id: true },
  });
  const testContactIds = testContacts.map(c => c.id);

  if (testContactIds.length > 0) {
    await prisma.contactFieldValue.deleteMany({ where: { contactId: { in: testContactIds } } });
    await prisma.contactListMember.deleteMany({ where: { contactId: { in: testContactIds } } });
    await prisma.contactToContactList.deleteMany({ where: { A: { in: testContactIds } } });
    await prisma.contact.deleteMany({ where: { id: { in: testContactIds } } });
  }
  await prisma.contactList.delete({ where: { id: testList.id } });

  // Final dashboard verification
  const finalCount = await prisma.contact.count({ where: { userId } });
  console.log(`  Post-cleanup contact count: ${finalCount} (should equal pre-import: ${preContacts})`);

  console.log("\n=== PHASE 3 COMPLETE ===");
}

runImportValidation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

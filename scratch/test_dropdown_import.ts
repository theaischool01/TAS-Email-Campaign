import { PrismaClient } from "@prisma/client";
import { ImportService } from "../lib/services/import-service";

const prisma = new PrismaClient();

async function runTest() {
  console.log("=== STARTING DROPDOWN IMPORT TEST ===");
  const userId = "cmqav8tnn0000tahoebfdik6q"; // Saheel's user ID

  // 1. Create a List
  let list = await prisma.contactList.findFirst({
    where: { name: "Dropdown Test List", ownerId: userId }
  });
  if (!list) {
    list = await prisma.contactList.create({
      data: { name: "Dropdown Test List", ownerId: userId }
    });
  }

  // 2. Create a Dropdown Custom Field
  let customField = await prisma.contactCustomField.findFirst({
    where: { userId, key: "state_region" }
  });
  if (customField) {
    await prisma.contactCustomField.delete({ where: { id: customField.id } });
  }
  
  customField = await prisma.contactCustomField.create({
    data: {
      userId,
      key: "state_region",
      displayName: "State Region",
      type: "DROPDOWN",
      options: JSON.stringify(["TS", "AP", "TN", "KA"]),
      isRequired: false
    }
  });

  const mappings = {
    "Email": { action: "SYSTEM" as const, field: "email" },
    "State Region": { action: "MAP_CUSTOM_FIELD" as const, fieldId: customField.id }
  };

  // Scenario A: Standard imports with aliases and casing
  const rowsA = [
    { "Email": "test_tg_1@example.com", "State Region": "Telangana" },
    { "Email": "test_ap_2@example.com", "State Region": " Andhra Pradesh " },
    { "Email": "test_tn_3@example.com", "State Region": "tamil nadu" },
    { "Email": "test_ka_4@example.com", "State Region": " ka " }
  ];

  console.log("\n--- Scenario A: Importing with aliases & casing ---");
  const resultA = await ImportService.importContacts(
    userId,
    list.id,
    rowsA,
    mappings,
    prisma,
    { autoCreateDropdownOptions: false }
  );

  console.log("Ingestion results:", resultA.results);
  console.log("Errors:", resultA.errors);

  // Scenario B: Import unrecognized option without auto-create (should fail)
  const rowsB = [
    { "Email": "test_mh_5@example.com", "State Region": "MH" }
  ];

  console.log("\n--- Scenario B: Importing unrecognized option without auto-create (expected to fail) ---");
  const resultB = await ImportService.importContacts(
    userId,
    list.id,
    rowsB,
    mappings,
    prisma,
    { autoCreateDropdownOptions: false }
  );
  console.log("Ingestion results:", resultB.results);
  console.log("Errors (expected):", resultB.errors);

  // Scenario C: Import unrecognized option with auto-create (should succeed)
  console.log("\n--- Scenario C: Importing unrecognized option with auto-create enabled ---");
  const resultC = await ImportService.importContacts(
    userId,
    list.id,
    rowsB,
    mappings,
    prisma,
    { autoCreateDropdownOptions: true }
  );
  console.log("Ingestion results:", resultC.results);
  console.log("Errors:", resultC.errors);

  // Verify updated options in DB
  const updatedField = await prisma.contactCustomField.findUnique({
    where: { id: customField.id }
  });
  console.log("Updated state_region custom field options:", JSON.parse(updatedField!.options || "[]"));

  // Verify values written to database
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      email: { in: ["test_tg_1@example.com", "test_ap_2@example.com", "test_tn_3@example.com", "test_ka_4@example.com", "test_mh_5@example.com"] }
    },
    include: {
      customFieldValues: true
    }
  });

  console.log("\nValues written to database:");
  contacts.forEach(c => {
    const val = c.customFieldValues.find(v => v.fieldId === customField.id);
    console.log(`- ${c.email}: state_region = ${val?.textValue}`);
  });

  // Cleanup
  console.log("\nCleaning up test data...");
  await prisma.contactFieldValue.deleteMany({
    where: { fieldId: customField.id }
  });
  await prisma.contactCustomField.delete({
    where: { id: customField.id }
  });
  await prisma.contactListMember.deleteMany({
    where: { contactListId: list.id }
  });
  await prisma.contactToContactList.deleteMany({
    where: { B: list.id }
  });
  await prisma.contact.deleteMany({
    where: {
      userId,
      email: { in: ["test_tg_1@example.com", "test_ap_2@example.com", "test_tn_3@example.com", "test_ka_4@example.com", "test_mh_5@example.com"] }
    }
  });
  await prisma.contactList.delete({
    where: { id: list.id }
  });

  console.log("=== TEST COMPLETED ===");
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

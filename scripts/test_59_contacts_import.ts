import { PrismaClient } from "@prisma/client";
import { ImportService } from "../lib/services/import-service";
import { generateCustomFieldKey } from "../lib/custom-fields/key-generator";

const prisma = new PrismaClient() as any;
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q";

async function run59ImportTest() {
  console.log("🚀 Running 59-contact import verification...");

  // Setup a test contact list
  const testList = await prisma.contactList.create({
    data: {
      name: "Verification List 59",
      ownerId: TEST_USER_ID,
    },
  });

  // Pre-create custom fields
  const customField = await prisma.contactCustomField.upsert({
    where: { userId_key: { userId: TEST_USER_ID, key: "verification_score" } },
    update: { isArchived: false },
    create: {
      userId: TEST_USER_ID,
      key: "verification_score",
      displayName: "Verification Score",
      type: "NUMBER",
    },
  });

  // Generate 59 mock contacts
  const rows = [];
  for (let i = 1; i <= 59; i++) {
    rows.push({
      Email: `verify_recipient_${i}@example.com`,
      "First Name": `VerifyName${i}`,
      Score: `${80 + (i % 20)}`,
    });
  }

  // Clear existing from DB to be clean
  const emails = rows.map(r => r.Email);
  await prisma.contact.deleteMany({
    where: { userId: TEST_USER_ID, email: { in: emails } }
  });

  const mappings = {
    Email: { action: "SYSTEM", field: "email" },
    "First Name": { action: "SYSTEM", field: "firstName" },
    Score: { action: "MAP_CUSTOM_FIELD", fieldId: customField.id },
  };

  const startTime = performance.now();
  
  const result = await ImportService.importContacts(
    TEST_USER_ID,
    testList.id,
    rows,
    mappings as any,
    prisma
  );

  const endTime = performance.now();
  const executionTimeMs = endTime - startTime;

  // Query database to count created custom field values
  const contacts = await prisma.contact.findMany({
    where: { userId: TEST_USER_ID, email: { in: emails } },
    include: { customFieldValues: true }
  });

  let totalFieldValues = 0;
  contacts.forEach((c: any) => {
    totalFieldValues += c.customFieldValues.length;
  });

  console.log("\n=== IMPORT TEST RESULTS ===");
  console.log(`Total Contacts In Input: ${rows.length}`);
  console.log(`Contacts Successfully Processed: ${result.results.newContactsCreated}`);
  console.log(`Total Custom Field Values Written: ${totalFieldValues}`);
  console.log(`Execution Time: ${executionTimeMs.toFixed(2)} ms`);
  console.log(`Import Errors Count: ${result.errors.length}`);
  if (result.errors.length > 0) {
    console.log("Errors detail:", result.errors);
  }

  // Clean up
  await prisma.contactListMember.deleteMany({ where: { contactListId: testList.id } });
  await prisma.contactToContactList.deleteMany({ where: { B: testList.id } });
  await prisma.contactList.delete({ where: { id: testList.id } });
  await prisma.contact.deleteMany({
    where: { userId: TEST_USER_ID, email: { in: emails } }
  });
  console.log("Cleanup complete.");
}

run59ImportTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  });

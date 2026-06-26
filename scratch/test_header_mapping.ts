import { PrismaClient } from "@prisma/client";
import { ImportService } from "../lib/services/import-service";

const prisma = new PrismaClient();

async function runTest() {
  console.log("=== STARTING HEADER MAPPING TEST ===");
  const userId = "cmqav8tnn0000tahoebfdik6q"; // Saheel's user ID

  // 1. Create target list
  let list = await prisma.contactList.findFirst({
    where: { name: "Header Mapping Test List", ownerId: userId }
  });
  if (!list) {
    list = await prisma.contactList.create({
      data: { name: "Header Mapping Test List", ownerId: userId }
    });
  }

  // 2. Create custom fields matching the keys
  const fieldsToCreate = [
    { key: "passout_year", displayName: "Passout Year", type: "TEXT" },
    { key: "has_laptop", displayName: "Has Laptop", type: "TEXT" }
  ];

  const dbFields = [];
  for (const f of fieldsToCreate) {
    let cf = await prisma.contactCustomField.findFirst({
      where: { userId, key: f.key }
    });
    if (cf) {
      await prisma.contactFieldValue.deleteMany({ where: { fieldId: cf.id } });
      await prisma.contactCustomField.delete({ where: { id: cf.id } });
    }
    cf = await prisma.contactCustomField.create({
      data: {
        userId,
        key: f.key,
        displayName: f.displayName,
        type: f.type,
        isRequired: false
      }
    });
    dbFields.push(cf);
  }

  // 3. Import contacts using empty mappings object to trigger automatic fallback matching
  // Note that headers are 'Passout Year' and 'Has Laptop' (with spaces)
  const rows = [
    { "email": "mapped_test_1@example.com", "Passout Year": "2024", "Has Laptop": "Yes" },
    { "email": "mapped_test_2@example.com", "Passout Year": "2023", "Has Laptop": "No" }
  ];

  console.log("Ingesting contacts...");
  const result = await ImportService.importContacts(
    userId,
    list.id,
    rows,
    {}, // empty mappings triggers fallback mapping
    prisma
  );

  console.log("Results:", result.results);
  console.log("Errors:", result.errors);

  // 4. Verify values written to database
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      email: { in: ["mapped_test_1@example.com", "mapped_test_2@example.com"] }
    },
    include: {
      customFieldValues: true
    }
  });

  console.log("\nValues written to database:");
  contacts.forEach(c => {
    console.log(`- Contact: ${c.email}`);
    c.customFieldValues.forEach(val => {
      const field = dbFields.find(f => f.id === val.fieldId);
      if (field) {
        console.log(`  * ${field.key} = ${val.textValue}`);
      }
    });
  });

  // Cleanup
  console.log("\nCleaning up test data...");
  for (const f of dbFields) {
    await prisma.contactFieldValue.deleteMany({ where: { fieldId: f.id } });
    await prisma.contactCustomField.delete({ where: { id: f.id } });
  }
  await prisma.contactListMember.deleteMany({ where: { contactListId: list.id } });
  await prisma.contactToContactList.deleteMany({ where: { B: list.id } });
  await prisma.contact.deleteMany({
    where: {
      userId,
      email: { in: ["mapped_test_1@example.com", "mapped_test_2@example.com"] }
    }
  });
  await prisma.contactList.delete({ where: { id: list.id } });

  console.log("=== HEADER MAPPING TEST COMPLETED ===");
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

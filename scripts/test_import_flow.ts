import { PrismaClient } from "@prisma/client";
import { ImportService } from "../lib/services/import-service";
import { generateCustomFieldKey } from "../lib/custom-fields/key-generator";

const prisma = new PrismaClient() as any;

const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q"; // Saheel's User ID

async function runTests() {
  console.log("🚀 STARTING CSV IMPORT & SCHEMA MAPPING ENGINE INTEGRATION TESTS...");

  // Setup a test contact list
  const testList = await prisma.contactList.create({
    data: {
      name: "Test Import List",
      ownerId: TEST_USER_ID,
    },
  });

  const targetListId = testList.id;
  console.log(`Created temporary contact list: ${targetListId}`);

  try {
    // -------------------------------------------------------------
    // Test 1 & 2: Existing Contact Update & Empty Cell Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST 1 & 2: Existing Contact Update & Empty Cell Protection ---");
    // Pre-create a contact
    const existingEmail = "existing_test_contact@example.com";
    await prisma.contact.deleteMany({ where: { userId: TEST_USER_ID, email: existingEmail } });
    
    const preContact = await prisma.contact.create({
      data: {
        userId: TEST_USER_ID,
        email: existingEmail,
        firstName: "OldName",
        company: "OldCompany",
        status: "ACTIVE",
      },
    });

    // Create a custom field "state" and set existing value
    const stateField = await prisma.contactCustomField.upsert({
      where: { userId_key: { userId: TEST_USER_ID, key: "state" } },
      update: { isArchived: false },
      create: {
        userId: TEST_USER_ID,
        key: "state",
        displayName: "State",
        type: "TEXT",
      },
    });

    await prisma.contactFieldValue.upsert({
      where: { contactId_fieldId: { contactId: preContact.id, fieldId: stateField.id } },
      update: { textValue: "Telangana" },
      create: {
        contactId: preContact.id,
        fieldId: stateField.id,
        textValue: "Telangana",
      },
    });

    // CSV input updates firstName to "NewName", state to "Karnataka", and company to "" (empty cell protection)
    const csvRows1 = [
      {
        Email: existingEmail,
        "First Name": "NewName",
        State: "Karnataka",
        Company: "",
      },
    ];

    const mappings1 = {
      Email: { action: "SYSTEM", field: "email" },
      "First Name": { action: "SYSTEM", field: "firstName" },
      Company: { action: "SYSTEM", field: "company" },
      State: { action: "MAP_CUSTOM_FIELD", fieldId: stateField.id },
    };

    const res1 = await ImportService.importContacts(
      TEST_USER_ID,
      targetListId,
      csvRows1,
      mappings1 as any,
      prisma
    );

    console.log("Import result:", res1.results);
    if (res1.errors.length > 0) {
      console.log("Import errors:", res1.errors);
    }

    // Verify firstName is updated, state is updated to "Karnataka", and company remains "OldCompany"
    const verifiedContact1 = await prisma.contact.findUnique({
      where: { id: preContact.id },
      include: { customFieldValues: { include: { customField: true } } },
    });

    if (verifiedContact1.firstName !== "NewName") {
      throw new Error(`Test 1 Failed: expected firstName 'NewName', got '${verifiedContact1.firstName}'`);
    }
    if (verifiedContact1.company !== "OldCompany") {
      throw new Error(`Test 2 Failed (Empty Cell Protection): expected company to remain 'OldCompany', got '${verifiedContact1.company}'`);
    }

    const stateVal = verifiedContact1.customFieldValues.find((v: any) => v.customField.key === "state");
    if (stateVal?.textValue !== "Karnataka") {
      throw new Error(`Test 1 Failed: expected state custom value 'Karnataka', got '${stateVal?.textValue}'`);
    }
    console.log("✅ TEST 1 & 2 PASSED: Existing contact updated, empty cell protection verified.");

    // -------------------------------------------------------------
    // Test 3: New Custom Field Creation
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: New Custom Field Creation ---");
    // Pre-create dynamic field inline (simulation of execute route handler)
    const salaryDisplayName = "Salary";
    const salaryKey = generateCustomFieldKey(salaryDisplayName);
    
    // Clean up if salary already exists
    await prisma.contactCustomField.deleteMany({
      where: { userId: TEST_USER_ID, key: salaryKey }
    });

    const salaryField = await prisma.contactCustomField.create({
      data: {
        userId: TEST_USER_ID,
        key: salaryKey,
        displayName: salaryDisplayName,
        type: "NUMBER",
      },
    });

    const newEmail = "new_salary_contact@example.com";
    await prisma.contact.deleteMany({ where: { userId: TEST_USER_ID, email: newEmail } });

    const csvRows2 = [
      {
        Email: newEmail,
        Salary: "125000",
      },
    ];

    const mappings2 = {
      Email: { action: "SYSTEM", field: "email" },
      Salary: { action: "MAP_CUSTOM_FIELD", fieldId: salaryField.id },
    };

    await ImportService.importContacts(
      TEST_USER_ID,
      targetListId,
      csvRows2,
      mappings2 as any,
      prisma
    );

    const verifiedContact2 = await prisma.contact.findFirst({
      where: { userId: TEST_USER_ID, email: newEmail },
      include: { customFieldValues: { include: { customField: true } } },
    });

    const salaryVal = verifiedContact2.customFieldValues.find((v: any) => v.customField.key === "salary");
    if (salaryVal?.numberValue !== 125000) {
      throw new Error(`Test 3 Failed: expected salary custom value 125000, got '${salaryVal?.numberValue}'`);
    }
    console.log("✅ TEST 3 PASSED: New Custom Field created inline and numeric values stored.");

    // -------------------------------------------------------------
    // Test 4: Existing Custom Field Mapping
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Existing Custom Field Mapping ---");
    const existingFieldEmail = "existing_custom_field@example.com";
    await prisma.contact.deleteMany({ where: { userId: TEST_USER_ID, email: existingFieldEmail } });

    const csvRows3 = [
      {
        Email: existingFieldEmail,
        State: "Telangana",
      },
    ];

    const mappings3 = {
      Email: { action: "SYSTEM", field: "email" },
      State: { action: "MAP_CUSTOM_FIELD", fieldId: stateField.id },
    };

    await ImportService.importContacts(
      TEST_USER_ID,
      targetListId,
      csvRows3,
      mappings3 as any,
      prisma
    );

    const verifiedContact3 = await prisma.contact.findFirst({
      where: { userId: TEST_USER_ID, email: existingFieldEmail },
      include: { customFieldValues: { include: { customField: true } } },
    });

    const stateVal3 = verifiedContact3.customFieldValues.find((v: any) => v.customField.key === "state");
    if (stateVal3?.textValue !== "Telangana") {
      throw new Error(`Test 4 Failed: expected state custom value 'Telangana', got '${stateVal3?.textValue}'`);
    }
    console.log("✅ TEST 4 PASSED: Map to existing custom field validated.");

    // -------------------------------------------------------------
    // Test 5: Duplicate Emails Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Duplicate Emails Protection ---");
    const duplicateEmail = "duplicate_email_test@example.com";
    await prisma.contact.deleteMany({ where: { userId: TEST_USER_ID, email: duplicateEmail } });

    // Try to import the same email twice in the same CSV
    const csvRows4 = [
      { Email: duplicateEmail, "First Name": "FirstInstance" },
      { Email: duplicateEmail, "First Name": "SecondInstance" },
    ];

    const mappings4 = {
      Email: { action: "SYSTEM", field: "email" },
      "First Name": { action: "SYSTEM", field: "firstName" },
    };

    await ImportService.importContacts(
      TEST_USER_ID,
      targetListId,
      csvRows4,
      mappings4 as any,
      prisma
    );

    const duplicateContacts = await prisma.contact.findMany({
      where: { userId: TEST_USER_ID, email: duplicateEmail },
    });

    if (duplicateContacts.length !== 1) {
      throw new Error(`Test 5 Failed: duplicate emails created ${duplicateContacts.length} contact records`);
    }
    console.log("✅ TEST 5 PASSED: Duplicate email prevention verified.");

    // -------------------------------------------------------------
    // Test 6: Large Dataset Simulation
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Large Dataset Simulation ---");
    // Build 1100 mock contacts to trigger multiple batch processes (500 row batches)
    const largeRows = [];
    for (let index = 1; index <= 1100; index++) {
      largeRows.push({
        Email: `large_recipient_${index}@example.com`,
        "First Name": `Recipient${index}`,
      });
    }

    // Clean up
    await prisma.contact.deleteMany({
      where: {
        userId: TEST_USER_ID,
        email: { startsWith: "large_recipient_" },
      },
    });

    const resLarge = await ImportService.importContacts(
      TEST_USER_ID,
      targetListId,
      largeRows,
      {
        Email: { action: "SYSTEM", field: "email" },
        "First Name": { action: "SYSTEM", field: "firstName" },
      } as any,
      prisma
    );

    console.log("Large import stats results:", resLarge.results);
    if (resLarge.results.newContactsCreated !== 1100) {
      throw new Error(`Test 6 Failed: expected 1100 new contacts, got ${resLarge.results.newContactsCreated}`);
    }
    console.log("✅ TEST 6 PASSED: 1100 rows batch processing executed correctly.");

  } finally {
    // Tear down list and tests contacts
    await prisma.contactListMember.deleteMany({ where: { contactListId: targetListId } });
    await prisma.contactToContactList.deleteMany({ where: { B: targetListId } });
    await prisma.contactList.delete({ where: { id: targetListId } });
    
    // Clean up test contacts
    await prisma.contact.deleteMany({
      where: {
        userId: TEST_USER_ID,
        email: {
          in: [
            "existing_test_contact@example.com",
            "new_salary_contact@example.com",
            "existing_custom_field@example.com",
            "duplicate_email_test@example.com",
          ],
        },
      },
    });
    await prisma.contact.deleteMany({
      where: {
        userId: TEST_USER_ID,
        email: { startsWith: "large_recipient_" },
      },
    });
    console.log("Cleaned up temporary test assets from DB.");
  }
}

runTests()
  .then(() => {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ TEST RUN ENCOUNTERED ERROR:", err);
    process.exit(1);
  });

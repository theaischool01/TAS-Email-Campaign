import { PrismaClient } from "@prisma/client";
import { SegmentQueryCompiler } from "../lib/segments/compiler";
import { validateCriteriaNode, CustomFieldMeta } from "../lib/segments/validator";

const prisma = new PrismaClient() as any;
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q";

async function verifySprint1() {
  console.log("🚀 Starting Sprint 1 End-to-End Verification...");

  // 1. Setup Custom Fields
  const cfState = await prisma.contactCustomField.upsert({
    where: { userId_key: { userId: TEST_USER_ID, key: "state" } },
    update: { isArchived: false, type: "DROPDOWN", options: "Telangana,Andhra Pradesh,Karnataka" },
    create: {
      userId: TEST_USER_ID,
      key: "state",
      displayName: "State",
      type: "DROPDOWN",
      options: "Telangana,Andhra Pradesh,Karnataka"
    }
  });

  const cfSalary = await prisma.contactCustomField.upsert({
    where: { userId_key: { userId: TEST_USER_ID, key: "salary" } },
    update: { isArchived: false, type: "NUMBER" },
    create: {
      userId: TEST_USER_ID,
      key: "salary",
      displayName: "Salary",
      type: "NUMBER"
    }
  });

  console.log("✅ Custom Fields configured.");

  // 2. Setup 5 mock contacts with predictable properties
  const mockContacts = [
    { email: "telangana_rich@example.com", firstName: "Rahul", lastName: "Yadav", state: "Telangana", salary: 45000 },
    { email: "telangana_poor@example.com", firstName: "Anil", lastName: "Kumar", state: "Telangana", salary: 8000 },
    { email: "telangana_mid@example.com", firstName: "Sneha", lastName: "Reddy", state: "Telangana", salary: 25000 },
    { email: "andhra_mid@example.com", firstName: "Venkatesh", lastName: "Naidu", state: "Andhra Pradesh", salary: 35000 },
    { email: "karnataka_mid@example.com", firstName: "Priya", lastName: "Gowda", state: "Karnataka", salary: 15000 }
  ];

  // Clean existing test emails
  const emails = mockContacts.map(c => c.email);
  await prisma.contact.deleteMany({
    where: { userId: TEST_USER_ID, email: { in: emails } }
  });

  const createdContacts = [];
  for (const mc of mockContacts) {
    const contact = await prisma.contact.create({
      data: {
        email: mc.email,
        firstName: mc.firstName,
        lastName: mc.lastName,
        userId: TEST_USER_ID,
        status: "ACTIVE",
        source: "MANUAL"
      }
    });
    createdContacts.push(contact);

    // Save field values
    await prisma.contactFieldValue.createMany({
      data: [
        { contactId: contact.id, fieldId: cfState.id, textValue: mc.state },
        { contactId: contact.id, fieldId: cfSalary.id, numberValue: mc.salary }
      ]
    });
  }

  console.log(`✅ ${createdContacts.length} Mock Contacts inserted.`);

  // Registry for validator
  const fieldRegistry = new Map<string, CustomFieldMeta>();
  fieldRegistry.set("state", { id: cfState.id, key: "state", type: "DROPDOWN" });
  fieldRegistry.set("salary", { id: cfSalary.id, key: "salary", type: "NUMBER" });

  // --------------------------------------------------
  // Test Case 1: State = Telangana
  // Expected match count: 3 (Rahul, Anil, Sneha)
  // --------------------------------------------------
  const criteriaState = {
    conjunction: "AND",
    rules: [
      {
        type: "RULE",
        field: "custom.state",
        operator: "equals",
        value: "Telangana"
      }
    ]
  };

  console.log("\n=== TEST CASE 1: State = Telangana ===");
  validateCriteriaNode(criteriaState, fieldRegistry);
  
  const estState = SegmentQueryCompiler.compile(TEST_USER_ID, criteriaState, fieldRegistry, { mode: "COUNT" });
  const countStateResult = await prisma.$queryRawUnsafe(estState.sql, ...estState.values);
  const countState = Number(countStateResult[0]?.count || 0);
  console.log(`Matching contacts estimate: ${countState} (Expected: 3)`);

  const previewStateQuery = SegmentQueryCompiler.compile(TEST_USER_ID, criteriaState, fieldRegistry, { mode: "STREAM", batchSize: 10 });
  const previewStateResult = await prisma.$queryRawUnsafe(previewStateQuery.sql, ...previewStateQuery.values) as Array<{ id: string }>;
  console.log("Preview matched IDs:", previewStateResult.map(r => r.id));

  // --------------------------------------------------
  // Test Case 2: Salary between 10000 and 50000
  // Expected match count: 4 (Rahul-45k, Sneha-25k, Venkatesh-35k, Priya-15k)
  // --------------------------------------------------
  const criteriaSalary = {
    conjunction: "AND",
    rules: [
      {
        type: "RULE",
        field: "custom.salary",
        operator: "between",
        value: [10000, 50000]
      }
    ]
  };

  console.log("\n=== TEST CASE 2: Salary between 10000 and 50000 ===");
  validateCriteriaNode(criteriaSalary, fieldRegistry);

  const estSalary = SegmentQueryCompiler.compile(TEST_USER_ID, criteriaSalary, fieldRegistry, { mode: "COUNT" });
  const countSalaryResult = await prisma.$queryRawUnsafe(estSalary.sql, ...estSalary.values);
  const countSalary = Number(countSalaryResult[0]?.count || 0);
  console.log(`Matching contacts estimate: ${countSalary} (Expected: 4)`);

  const previewSalaryQuery = SegmentQueryCompiler.compile(TEST_USER_ID, criteriaSalary, fieldRegistry, { mode: "STREAM", batchSize: 10 });
  const previewSalaryResult = await prisma.$queryRawUnsafe(previewSalaryQuery.sql, ...previewSalaryQuery.values) as Array<{ id: string }>;
  console.log("Preview matched IDs:", previewSalaryResult.map(r => r.id));

  // --------------------------------------------------
  // Test Case 3: Editing Criteria (State = Telangana AND Salary between 10000 and 50000)
  // Expected match count: 2 (Rahul-45k, Sneha-25k)
  // --------------------------------------------------
  const criteriaEdit = {
    conjunction: "AND",
    rules: [
      {
        type: "RULE",
        field: "custom.state",
        operator: "equals",
        value: "Telangana"
      },
      {
        type: "RULE",
        field: "custom.salary",
        operator: "between",
        value: [10000, 50000]
      }
    ]
  };

  console.log("\n=== TEST CASE 3: Dynamic Edit (State = Telangana AND Salary between 10k and 50k) ===");
  validateCriteriaNode(criteriaEdit, fieldRegistry);

  const estEdit = SegmentQueryCompiler.compile(TEST_USER_ID, criteriaEdit, fieldRegistry, { mode: "COUNT" });
  const countEditResult = await prisma.$queryRawUnsafe(estEdit.sql, ...estEdit.values);
  const countEdit = Number(countEditResult[0]?.count || 0);
  console.log(`Matching contacts estimate: ${countEdit} (Expected: 2)`);

  // Clean up mock data
  await prisma.contactFieldValue.deleteMany({
    where: { contactId: { in: createdContacts.map(c => c.id) } }
  });
  await prisma.contact.deleteMany({
    where: { userId: TEST_USER_ID, email: { in: emails } }
  });
  console.log("\n✅ Verification data cleaned up successfully.");
}

verifySprint1()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
  });

import { PrismaClient } from "@prisma/client";
import { SegmentQueryCompiler } from "../lib/segments/compiler";
import { ImportService } from "../lib/services/import-service";

const prisma = new PrismaClient() as any;
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q"; // Saheel's User ID

async function runTests() {
  console.log("🚀 STARTING DYNAMIC TAG MODEL INTEGRATION TESTS...");

  // Clean up any existing test contacts
  await prisma.contact.deleteMany({
    where: {
      userId: TEST_USER_ID,
      email: { in: ["tag_test_1@example.com", "tag_test_2@example.com", "tag_test_3@example.com"] }
    }
  });

  // Clean up any test tags for this user to ensure clean test state
  await prisma.contactTag.deleteMany({
    where: { contact: { userId: TEST_USER_ID } }
  });
  await prisma.tag.deleteMany({
    where: { userId: TEST_USER_ID }
  });

  // -------------------------------------------------------------
  // Test 1: Manual Creation (Relational Tag Insertion)
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: Manual Creation with Relational Tags ---");

  // Create a contact simulating app/api/contacts/lists/[id]/contacts/route.ts POST transaction
  const contact1 = await prisma.$transaction(async (tx: any) => {
    const contact = await tx.contact.create({
      data: {
        userId: TEST_USER_ID,
        email: "tag_test_1@example.com",
        firstName: "Alpha",
        status: "ACTIVE",
        source: "MANUAL"
      }
    });

    const tagsToCreate = ["vip", "lead"];
    for (const name of tagsToCreate) {
      const slug = name.toLowerCase().trim();
      let tag = await tx.tag.findUnique({
        where: { userId_slug: { userId: TEST_USER_ID, slug } }
      });
      if (!tag) {
        tag = await tx.tag.create({
          data: { name, slug, userId: TEST_USER_ID }
        });
      }
      await tx.contactTag.create({
        data: { contactId: contact.id, tagId: tag.id }
      });
    }
    return contact;
  });

  console.log(`Created contact ${contact1.email} with tags "vip" and "lead".`);

  const createdTags = await prisma.tag.findMany({ where: { userId: TEST_USER_ID } });
  console.log("Tags in DB:", createdTags.map((t: any) => `${t.name} (slug: ${t.slug})`));
  if (createdTags.length !== 2) {
    throw new Error(`Expected 2 tags, got ${createdTags.length}`);
  }
  console.log("✅ Tag records created correctly.");

  // -------------------------------------------------------------
  // Test 2: Contact API PATCH Delta Updates
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Contact PATCH API Delta Tag Updates ---");

  // Update contact1 tags to "vip, customer" (remove "lead", add "customer")
  await prisma.$transaction(async (tx: any) => {
    const newTagsStr = "vip, customer";
    const tagList = newTagsStr.split(",").map((t: string) => t.trim()).filter(Boolean);
    const tagSlugs = tagList.map((t: string) => t.toLowerCase());

    // Find existing
    const existing = await tx.contactTag.findMany({
      where: { contactId: contact1.id },
      include: { tag: true }
    });
    const existingSlugs = existing.map((l: any) => l.tag.slug);

    // Remove deleted tags (lead)
    const toRemove = existing.filter((l: any) => !tagSlugs.includes(l.tag.slug));
    if (toRemove.length > 0) {
      await tx.contactTag.deleteMany({
        where: { id: { in: toRemove.map((l: any) => l.id) } }
      });
    }

    // Add missing (customer)
    for (const name of tagList) {
      const slug = name.toLowerCase();
      if (!existingSlugs.includes(slug)) {
        let tag = await tx.tag.findUnique({
          where: { userId_slug: { userId: TEST_USER_ID, slug } }
        });
        if (!tag) {
          tag = await tx.tag.create({
            data: { name, slug, userId: TEST_USER_ID }
          });
        }
        await tx.contactTag.create({
          data: { contactId: contact1.id, tagId: tag.id }
        });
      }
    }

    return contact1;
  });

  const currentLinks = await prisma.contactTag.findMany({
    where: { contactId: contact1.id },
    include: { tag: true }
  });

  console.log("Current tags for contact1:", currentLinks.map((l: any) => l.tag.name));
  const linkNames = currentLinks.map((l: any) => l.tag.name);
  if (!linkNames.includes("vip") || !linkNames.includes("customer") || linkNames.includes("lead")) {
    throw new Error("Delta update failed: tags are incorrect.");
  }
  console.log("✅ Delta tag assignment completed correctly.");

  // -------------------------------------------------------------
  // Test 3: Relational Segment Query Compiling & Execution
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Relational Segment Query Compiler ---");

  // Create another contact with only "customer"
  const contact2 = await prisma.$transaction(async (tx: any) => {
    const contact = await tx.contact.create({
      data: {
        userId: TEST_USER_ID,
        email: "tag_test_2@example.com",
        firstName: "Beta",
        status: "ACTIVE",
        source: "MANUAL"
      }
    });

    const tag = await tx.tag.findUnique({
      where: { userId_slug: { userId: TEST_USER_ID, slug: "customer" } }
    });
    await tx.contactTag.create({
      data: { contactId: contact.id, tagId: tag.id }
    });
    return contact;
  });

  // Create another contact with "vip" and "customer"
  const contact3 = await prisma.$transaction(async (tx: any) => {
    const contact = await tx.contact.create({
      data: {
        userId: TEST_USER_ID,
        email: "tag_test_3@example.com",
        firstName: "Gamma",
        status: "ACTIVE",
        source: "MANUAL"
      }
    });

    const tVip = await tx.tag.findUnique({ where: { userId_slug: { userId: TEST_USER_ID, slug: "vip" } } });
    const tCust = await tx.tag.findUnique({ where: { userId_slug: { userId: TEST_USER_ID, slug: "customer" } } });

    await tx.contactTag.create({ data: { contactId: contact.id, tagId: tVip.id } });
    await tx.contactTag.create({ data: { contactId: contact.id, tagId: tCust.id } });
    return contact;
  });

  // Compile check for contains_any ["vip"]
  const containsAnyCriteria = {
    conjunction: "AND",
    rules: [
      {
        type: "RULE",
        field: "contact.tags",
        operator: "contains_any",
        value: ["vip"]
      }
    ]
  };

  const compiledAny = SegmentQueryCompiler.compile(TEST_USER_ID, containsAnyCriteria, new Map(), {
    mode: "STREAM"
  });

  const resultsAny = await prisma.$queryRawUnsafe(compiledAny.sql, ...compiledAny.values);
  console.log("contains_any ['vip'] results:", resultsAny.map((r: any) => r.id));
  const anyIds = resultsAny.map((r: any) => r.id);
  if (!anyIds.includes(contact1.id) || !anyIds.includes(contact3.id) || anyIds.includes(contact2.id)) {
    throw new Error("Test 3.1 Failed: contains_any logic failed.");
  }
  console.log("✅ contains_any relational compilation matched correctly.");

  // Compile check for contains_all ["vip", "customer"] (contact1 and contact3 have both)
  const containsAllCriteria = {
    conjunction: "AND",
    rules: [
      {
        type: "RULE",
        field: "contact.tags",
        operator: "contains_all",
        value: ["vip", "customer"]
      }
    ]
  };

  const compiledAll = SegmentQueryCompiler.compile(TEST_USER_ID, containsAllCriteria, new Map(), {
    mode: "STREAM"
  });

  const resultsAll = await prisma.$queryRawUnsafe(compiledAll.sql, ...compiledAll.values);
  console.log("contains_all ['vip', 'customer'] results:", resultsAll.map((r: any) => r.id));
  const allIds = resultsAll.map((r: any) => r.id);
  if (!allIds.includes(contact1.id) || !allIds.includes(contact3.id) || allIds.includes(contact2.id)) {
    throw new Error("Test 3.2 Failed: contains_all logic failed.");
  }
  console.log("✅ contains_all relational count subquery compiled and matched correctly.");

  // -------------------------------------------------------------
  // Test 4: CSV Import Tag Sync
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: CSV Import Relational Tag Sync ---");

  // Create a contact list first
  const contactList = await prisma.contactList.create({
    data: {
      name: "Tag Import Test List",
      ownerId: TEST_USER_ID
    }
  });

  // Call ImportService with rows mapping to system fields
  const importRows = [
    {
      "Email Address": "tag_test_1@example.com", // existing
      "First Name": "Alpha Updated",
      "Tags List": "vip, imported_tag" // add "imported_tag"
    },
    {
      "Email Address": "tag_test_new@example.com", // new
      "First Name": "Omega New",
      "Tags List": "new_contact_tag, customer"
    }
  ];

  const mappings = {
    "Email Address": { action: "SYSTEM", field: "email" },
    "First Name": { action: "SYSTEM", field: "firstName" },
    "Tags List": { action: "SYSTEM", field: "tags" }
  };

  const importResult = await ImportService.importContacts(
    TEST_USER_ID,
    contactList.id,
    importRows,
    mappings,
    prisma
  );

  console.log("Import results counts:", importResult.results);

  // Check tags for new contact "tag_test_new@example.com"
  const newContact = await prisma.contact.findUnique({
    where: { userId_email: { userId: TEST_USER_ID, email: "tag_test_new@example.com" } },
    include: { contactTags: { include: { tag: true } } }
  });

  if (!newContact) {
    throw new Error("New contact was not imported.");
  }
  const newContactTags = newContact.contactTags.map((ct: any) => ct.tag.name);
  console.log("New contact tags:", newContactTags);
  if (!newContactTags.includes("new_contact_tag") || !newContactTags.includes("customer")) {
    throw new Error("New contact tags relational mapping failed.");
  }

  // Check tags for updated contact "tag_test_1@example.com"
  const updatedContactFromDb = await prisma.contact.findUnique({
    where: { id: contact1.id },
    include: { contactTags: { include: { tag: true } } }
  });
  const updatedContactTags = updatedContactFromDb.contactTags.map((ct: any) => ct.tag.name);
  console.log("Updated contact tags:", updatedContactTags);
  if (!updatedContactTags.includes("vip") || !updatedContactTags.includes("customer") || !updatedContactTags.includes("imported_tag")) {
    throw new Error("Existing contact tags merge and relational mapping failed.");
  }

  console.log("✅ CSV Import tag ingestion verified.");

  // -------------------------------------------------------------
  // Clean up
  // -------------------------------------------------------------
  console.log("\n🧹 Cleaning up test data...");
  await prisma.contact.deleteMany({
    where: {
      userId: TEST_USER_ID,
      email: { in: ["tag_test_1@example.com", "tag_test_2@example.com", "tag_test_3@example.com", "tag_test_new@example.com"] }
    }
  });
  await prisma.contactList.delete({ where: { id: contactList.id } });
  await prisma.contactTag.deleteMany({
    where: { contact: { userId: TEST_USER_ID } }
  });
  await prisma.tag.deleteMany({
    where: { userId: TEST_USER_ID }
  });
}

runTests()
  .then(() => {
    console.log("🎉 ALL DYNAMIC TAG MODEL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ TESTS RUN ENCOUNTERED ERROR:", err);
    process.exit(1);
  });

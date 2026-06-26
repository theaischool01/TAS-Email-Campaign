import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getActualValue(val: any) {
  if (val.textValue !== null && val.textValue !== undefined) return val.textValue;
  if (val.numberValue !== null && val.numberValue !== undefined) return val.numberValue;
  if (val.booleanValue !== null && val.booleanValue !== undefined) return val.booleanValue;
  if (val.dateValue !== null && val.dateValue !== undefined) return val.dateValue;
  if (val.jsonValue !== null && val.jsonValue !== undefined) return val.jsonValue;
  return null;
}

async function runAudit() {
  console.log("=== PART 1: CUSTOM FIELD VALUE AUDIT ===");
  const totalFields = await prisma.contactCustomField.count();
  const totalValues = await prisma.contactFieldValue.count();
  console.log(`Total ContactCustomField records: ${totalFields}`);
  console.log(`Total ContactFieldValue records: ${totalValues}`);

  const targetKeys = ["state", "stream_branch", "qualification", "address"];
  for (const key of targetKeys) {
    const field = await prisma.contactCustomField.findFirst({
      where: { key }
    });
    if (field) {
      const valCount = await prisma.contactFieldValue.count({
        where: { fieldId: field.id }
      });
      console.log(`\nField: ${field.displayName}`);
      console.log(`ID: ${field.id}`);
      console.log(`Key: ${field.key}`);
      console.log(`Type: ${field.type}`);
      console.log(`Values Stored: ${valCount}`);
    } else {
      console.log(`\nField with key "${key}" not found.`);
    }
  }

  console.log("\n=== PART 2: SAMPLE CONTACT AUDIT ===");
  // Let's get the 5 latest contacts created
  const latestContacts = await prisma.contact.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      customFieldValues: {
        include: {
          customField: true
        }
      }
    }
  });

  for (const contact of latestContacts) {
    console.log(`\nContact: ${contact.email}`);
    console.log(`ID: ${contact.id}`);
    if (contact.customFieldValues.length === 0) {
      console.log("No ContactFieldValue rows found");
    } else {
      console.log("Field Values:");
      for (const val of contact.customFieldValues) {
        console.log(`  ${val.customField.displayName} (${val.customField.key}) = ${getActualValue(val)}`);
      }
    }
  }

  console.log("\n=== PART 5: LIST MEMBERSHIP AUDIT ===");
  const listName = "Ultimate Dataset Test";
  const list = await prisma.contactList.findFirst({
    where: { name: listName }
  });

  if (list) {
    const memberCount = await prisma.contactListMember.count({
      where: { contactListId: list.id }
    });
    const uniqueContacts = await prisma.contactListMember.findMany({
      where: { contactListId: list.id },
      select: { contactId: true },
      distinct: ["contactId"]
    });
    console.log(`List: ${listName}`);
    console.log(`ID: ${list.id}`);
    console.log(`Membership count in database: ${memberCount}`);
    console.log(`Unique contacts in list: ${uniqueContacts.length}`);
  } else {
    console.log(`List "${listName}" not found`);
  }
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

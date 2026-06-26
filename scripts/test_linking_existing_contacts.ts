import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DB AUDIT START ===");
  const targetKeys = ["passout_year", "has_laptop", "ready_to_relocate", "ready_to_work_from_office", "state"];

  // 1. Fetch custom fields definition
  const fields = await prisma.contactCustomField.findMany({
    where: {
      key: { in: targetKeys }
    }
  });

  console.log("Fields defined in DB:", JSON.stringify(fields, null, 2));

  // 2. Fetch total values stored per field
  for (const field of fields) {
    const valuesCount = await prisma.contactFieldValue.count({
      where: { fieldId: field.id }
    });

    const samples = await prisma.contactFieldValue.findMany({
      where: { fieldId: field.id },
      take: 5,
      select: {
        id: true,
        textValue: true,
        numberValue: true,
        dateValue: true,
        booleanValue: true,
        jsonValue: true,
        contactId: true
      }
    });

    console.log(`\nField [${field.key}] (${field.displayName}) - ID: ${field.id}`);
    console.log(`Total Value Rows: ${valuesCount}`);
    console.log("Sample 5 Values:", JSON.stringify(samples, null, 2));
  }

  // 3. Find a contact that has custom fields and inspect its structure
  const sampleValue = await prisma.contactFieldValue.findFirst({
    where: {
      fieldId: { in: fields.map(f => f.id) }
    },
    include: {
      contact: true
    }
  });

  if (sampleValue) {
    const contact = await prisma.contact.findUnique({
      where: { id: sampleValue.contactId },
      include: {
        customFieldValues: {
          include: {
            customField: true
          }
        }
      }
    });

    if (contact) {
      const relationTagsStr = "";
      const { CustomValueService } = require("../lib/custom-fields/value-service");
      const customFields = CustomValueService.flattenCustomFieldValues(contact.customFieldValues);
      console.log("\n=== SAMPLE CONTACT FROM API RESPONSE ===");
      console.log("contact.customFields object for email:", contact.email);
      console.log(JSON.stringify(customFields, null, 2));
    }
  } else {
    console.log("\nNo contact field values found at all for these custom fields.");
  }

  console.log("=== DB AUDIT END ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

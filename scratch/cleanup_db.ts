import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runCleanup() {
  console.log("=== DB CLEANUP STARTED ===");

  // 1. Record counts before cleanup
  const contactsBefore = await prisma.contact.count();
  const membersBefore = await prisma.contactListMember.count();
  const tagsBefore = await prisma.contactTag.count();
  const fieldValuesBefore = await prisma.contactFieldValue.count();
  const logsBefore = await prisma.campaignActivityLog.count();
  const logsReferencingContactBefore = await prisma.campaignActivityLog.count({
    where: { contactId: { not: null } }
  });

  console.log("Counts before cleanup:");
  console.log(`- Contacts: ${contactsBefore}`);
  console.log(`- ContactListMembers: ${membersBefore}`);
  console.log(`- ContactTags: ${tagsBefore}`);
  console.log(`- ContactFieldValues: ${fieldValuesBefore}`);
  console.log(`- Total Activity Logs: ${logsBefore}`);
  console.log(`- Logs Referencing Contacts: ${logsReferencingContactBefore}`);

  // 2. Perform transactional updates and deletes
  let success = false;
  let errorMsg = "";

  try {
    await prisma.$transaction(async (tx) => {
      // Step A: Set contactId to NULL in campaign activity logs to release FK constraint
      console.log("A. Removing foreign key references from campaign activity logs...");
      const updateResult = await tx.campaignActivityLog.updateMany({
        where: { contactId: { not: null } },
        data: { contactId: null }
      });
      console.log(`   Updated ${updateResult.count} logs.`);

      // Step B: Set contactId to NULL in email deliveries (if any missed by schema cascades)
      console.log("B. Removing foreign key references from email deliveries...");
      const deliveryResult = await tx.emailDelivery.updateMany({
        where: { contactId: { not: null } },
        data: { contactId: null }
      });
      console.log(`   Updated ${deliveryResult.count} deliveries.`);

      // Step C: Delete contact list memberships
      console.log("C. Deleting all contact list memberships...");
      const delMembers = await tx.contactListMember.deleteMany();
      console.log(`   Deleted ${delMembers.count} memberships.`);

      // Step D: Delete contact tag links
      console.log("D. Deleting all contact tag links...");
      const delTags = await tx.contactTag.deleteMany();
      console.log(`   Deleted ${delTags.count} tag links.`);

      // Step E: Delete contact custom field values
      console.log("E. Deleting all custom field values...");
      const delValues = await tx.contactFieldValue.deleteMany();
      console.log(`   Deleted ${delValues.count} values.`);

      // Step F: Delete all contacts
      console.log("F. Deleting all contacts...");
      const delContacts = await tx.contact.deleteMany();
      console.log(`   Deleted ${delContacts.count} contacts.`);
    });
    success = true;
    console.log("Transaction committed successfully!");
  } catch (err: any) {
    success = false;
    errorMsg = err.message || err.toString();
    console.error("❌ Transaction failed and rolled back:", err);
  }

  // 3. Record counts after cleanup
  const contactsAfter = await prisma.contact.count();
  const membersAfter = await prisma.contactListMember.count();
  const tagsAfter = await prisma.contactTag.count();
  const fieldValuesAfter = await prisma.contactFieldValue.count();
  const logsAfter = await prisma.campaignActivityLog.count();
  const logsReferencingContactAfter = await prisma.campaignActivityLog.count({
    where: { contactId: { not: null } }
  });

  console.log("\n=== DB CLEANUP COMPLETED ===");
  console.log(`Success: ${success}`);
  if (!success) {
    console.log(`Error: ${errorMsg}`);
  }
  console.log("Counts after cleanup:");
  console.log(`- Contacts: ${contactsAfter}`);
  console.log(`- ContactListMembers: ${membersAfter}`);
  console.log(`- ContactTags: ${tagsAfter}`);
  console.log(`- ContactFieldValues: ${fieldValuesAfter}`);
  console.log(`- Total Activity Logs: ${logsAfter}`);
  console.log(`- Logs Referencing Contacts: ${logsReferencingContactAfter}`);
}

runCleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

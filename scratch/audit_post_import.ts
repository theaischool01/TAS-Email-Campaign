import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("=== RUNNING POST-IMPORT DATA AUDIT ===");

  // 1. CONTACT COUNTS
  const totalContacts = await prisma.contact.count();
  const totalMemberships = await prisma.contactListMember.count();
  const totalRelationLinks = await prisma.contactToContactList.count();
  
  const lists = await prisma.contactList.findMany({
    include: {
      _count: {
        select: { members: true }
      }
    }
  });

  // 2. DUPLICATE DETECTION
  const emailGroups = await prisma.$queryRaw`
    SELECT email, COUNT(*) as count 
    FROM contacts 
    GROUP BY email 
    HAVING COUNT(*) > 1
  ` as any[];

  const nonNormalizedEmails = await prisma.contact.count({
    where: {
      NOT: {
        email: {
          equals: prisma.contact.fields.email // In Prisma we can check if email equals lower case
        }
      }
    }
  });

  // Explicit SQL check for normalization to be absolutely sure
  const rawNonNormalized = await prisma.$queryRaw`
    SELECT COUNT(*)::integer as count FROM contacts WHERE email != LOWER(email)
  ` as any[];
  const uppercaseCount = rawNonNormalized[0]?.count || 0;

  // 3. LIST MEMBERSHIPS & ORPHANS
  // Orphan contacts (no membership at all)
  const orphanContacts = await prisma.$queryRaw`
    SELECT COUNT(*)::integer as count 
    FROM contacts c
    LEFT JOIN contact_list_members m ON c.id = m."contactId"
    WHERE m.id IS NULL
  ` as any[];
  const orphanContactCount = orphanContacts[0]?.count || 0;

  // Orphan memberships pointing to non-existent contacts
  const orphanMemberships = await prisma.$queryRaw`
    SELECT COUNT(*)::integer as count 
    FROM contact_list_members m
    LEFT JOIN contacts c ON m."contactId" = c.id
    WHERE c.id IS NULL
  ` as any[];
  const orphanMembershipCount = orphanMemberships[0]?.count || 0;

  // 4. CUSTOM FIELD IMPORTS
  const totalFieldValues = await prisma.contactFieldValue.count();
  const archivedFieldsUsed = await prisma.contactFieldValue.count({
    where: {
      customField: { isArchived: true }
    }
  });

  // Populated vs Empty values (textValue, numberValue, etc.)
  const customFieldPopulated = await prisma.$queryRaw`
    SELECT 
      COUNT(CASE WHEN "textValue" IS NOT NULL OR "numberValue" IS NOT NULL OR "dateValue" IS NOT NULL OR "booleanValue" IS NOT NULL OR "jsonValue" IS NOT NULL THEN 1 END)::integer as populated,
      COUNT(CASE WHEN "textValue" IS NULL AND "numberValue" IS NULL AND "dateValue" IS NULL AND "booleanValue" IS NULL AND "jsonValue" IS NULL THEN 1 END)::integer as empty
    FROM contact_field_values
  ` as any[];
  const populatedCount = customFieldPopulated[0]?.populated || 0;
  const emptyCount = customFieldPopulated[0]?.empty || 0;

  // 5. DATA QUALITY AUDIT
  const invalidEmailRegex = await prisma.$queryRaw`
    SELECT COUNT(*)::integer as count 
    FROM contacts 
    WHERE email NOT LIKE '%_@__%.__%'
  ` as any[];
  const invalidEmailCount = invalidEmailRegex[0]?.count || 0;

  const blankEmails = await prisma.contact.count({
    where: { email: "" }
  });

  const blankNames = await prisma.contact.count({
    where: {
      AND: [
        { OR: [{ firstName: null }, { firstName: "" }] },
        { OR: [{ lastName: null }, { lastName: "" }] }
      ]
    }
  });

  const duplicatePhones = await prisma.$queryRaw`
    SELECT phone, COUNT(*) as count 
    FROM contacts 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
  ` as any[];

  // 6. OUTPUT RESULTS
  console.log("\n--- 1. CONTACT COUNTS ---");
  console.log(`Total contacts in database : ${totalContacts}`);
  console.log(`Total membership rows      : ${totalMemberships}`);
  console.log(`Total implicit join rows   : ${totalRelationLinks}`);
  lists.forEach(l => {
    console.log(`- List "${l.name}" (ID: ${l.id}) contains ${l._count.members} members`);
  });

  console.log("\n--- 2. DUPLICATE DETECTION ---");
  console.log(`Duplicate emails found in DB   : ${emailGroups.length}`);
  console.log(`Non-lowercase normalized emails: ${uppercaseCount}`);

  console.log("\n--- 3. LIST MEMBERSHIPS & ORPHANS ---");
  console.log(`Orphan contacts (no list)      : ${orphanContactCount}`);
  console.log(`Orphan list memberships        : ${orphanMembershipCount}`);

  console.log("\n--- 4. CUSTOM FIELD IMPORTS ---");
  console.log(`Total custom field values   : ${totalFieldValues}`);
  console.log(`- Populated values          : ${populatedCount}`);
  console.log(`- Empty values              : ${emptyCount}`);
  console.log(`- Values of archived fields : ${archivedFieldsUsed}`);

  console.log("\n--- 5. DATA QUALITY ---");
  console.log(`Malformed email formats     : ${invalidEmailCount}`);
  console.log(`Blank emails                : ${blankEmails}`);
  console.log(`Blank names (first & last)  : ${blankNames}`);
  console.log(`Duplicate phone numbers     : ${duplicatePhones.length}`);
}

runAudit()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

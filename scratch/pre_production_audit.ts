import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function audit() {
  const userId = "cmqav8tnn0000tahoebfdik6q";

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║      FINAL PRE-PRODUCTION IMPORT AUDIT                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // =============================
  // 1. DATABASE INTEGRITY
  // =============================
  console.log("═══════════════════════════════════════");
  console.log("  SECTION 1: DATABASE INTEGRITY");
  console.log("═══════════════════════════════════════\n");

  const totalContacts = await prisma.contact.count({ where: { userId } });
  const totalLists = await prisma.contactList.count({ where: { ownerId: userId } });
  const totalMemberships = await prisma.contactListMember.count();
  const totalCustomFields = await prisma.contactCustomField.count({ where: { userId } });
  const totalFieldValues = await prisma.contactFieldValue.count();

  console.log(`  Total Contacts:              ${totalContacts}`);
  console.log(`  Total Contact Lists:         ${totalLists}`);
  console.log(`  Total List Memberships:      ${totalMemberships}`);
  console.log(`  Total Custom Fields:         ${totalCustomFields}`);
  console.log(`  Total Custom Field Values:   ${totalFieldValues}`);

  // Duplicate emails
  const allContacts = await prisma.contact.findMany({
    where: { userId },
    select: { id: true, email: true },
  });
  const emailCounts = new Map<string, number>();
  for (const c of allContacts) {
    const e = c.email.toLowerCase();
    emailCounts.set(e, (emailCounts.get(e) || 0) + 1);
  }
  const duplicateEmails = [...emailCounts.entries()].filter(([, count]) => count > 1);
  console.log(`\n  Duplicate emails:            ${duplicateEmails.length}`);
  if (duplicateEmails.length > 0) {
    for (const [email, count] of duplicateEmails) {
      console.log(`    ⚠️  "${email}" appears ${count} times`);
    }
  }

  // Contacts without memberships
  const contactsWithMemberships = await prisma.contactListMember.findMany({
    select: { contactId: true },
    distinct: ["contactId"],
  });
  const memberContactIds = new Set(contactsWithMemberships.map(m => m.contactId));
  const orphanContacts = allContacts.filter(c => !memberContactIds.has(c.id));
  console.log(`  Contacts without memberships: ${orphanContacts.length}`);
  if (orphanContacts.length > 0 && orphanContacts.length <= 10) {
    for (const c of orphanContacts) {
      console.log(`    ⚠️  ${c.email} (${c.id})`);
    }
  }

  // Memberships pointing to missing contacts
  const allContactIds = new Set(allContacts.map(c => c.id));
  const allMemberships = await prisma.contactListMember.findMany({
    select: { contactId: true, contactListId: true },
  });
  const orphanMemberships = allMemberships.filter(m => !allContactIds.has(m.contactId));
  console.log(`  Orphan memberships:          ${orphanMemberships.length}`);

  // Field values pointing to missing contacts
  const allFieldValues = await prisma.contactFieldValue.findMany({
    select: { contactId: true, fieldId: true },
  });
  const orphanFieldValues = allFieldValues.filter(v => !allContactIds.has(v.contactId));
  console.log(`  Orphan field values:         ${orphanFieldValues.length}`);

  // Archived fields still receiving values
  const archivedFields = await prisma.contactCustomField.findMany({
    where: { userId, isArchived: true },
    select: { id: true, displayName: true },
  });
  let archivedWithValues = 0;
  for (const af of archivedFields) {
    const count = await prisma.contactFieldValue.count({ where: { fieldId: af.id } });
    if (count > 0) {
      console.log(`    ⚠️  Archived field "${af.displayName}" has ${count} values`);
      archivedWithValues++;
    }
  }
  console.log(`  Archived fields with values: ${archivedWithValues}`);

  // Lists with member counts
  const lists = await prisma.contactList.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true },
  });
  console.log(`\n  List membership audit:`);
  for (const list of lists) {
    const memberCount = await prisma.contactListMember.count({ where: { contactListId: list.id } });
    console.log(`    "${list.name}" — ${memberCount} members`);
  }

  // =============================
  // 2. CUSTOM FIELD AUDIT
  // =============================
  console.log("\n═══════════════════════════════════════");
  console.log("  SECTION 2: CUSTOM FIELD AUDIT");
  console.log("═══════════════════════════════════════\n");

  const allFields = await prisma.contactCustomField.findMany({
    where: { userId },
    orderBy: { displayOrder: "asc" },
  });

  let fieldIssues = 0;
  for (const f of allFields) {
    const isDropdown = f.type === "DROPDOWN" || f.type === "MULTI_SELECT";

    console.log(`  ┌─ "${f.displayName}"`);
    console.log(`  │  Key:       ${f.key}`);
    console.log(`  │  Type:      ${f.type}`);
    console.log(`  │  Archived:  ${f.isArchived}`);
    console.log(`  │  Required:  ${f.isRequired}`);

    if (isDropdown) {
      if (!f.options) {
        console.log(`  │  Options:   ⚠️ NULL (dropdown with no options!)`);
        fieldIssues++;
      } else {
        const raw = f.options.trim();
        let isValidJson = false;
        let parsedOptions: string[] = [];

        if (raw.startsWith("[")) {
          try {
            parsedOptions = JSON.parse(raw);
            isValidJson = true;
          } catch (_) {
            console.log(`  │  Options:   ❌ MALFORMED JSON: ${raw.substring(0, 60)}`);
            fieldIssues++;
          }
        } else {
          console.log(`  │  Options:   ❌ RAW CSV STRING: ${raw.substring(0, 60)}`);
          parsedOptions = raw.split(",").map(s => s.trim());
          fieldIssues++;
        }

        if (isValidJson || parsedOptions.length > 0) {
          console.log(`  │  Format:    ${isValidJson ? "✅ Valid JSON" : "⚠️ CSV fallback"}`);
          console.log(`  │  Count:     ${parsedOptions.length} options`);

          // Detect duplicates (case-insensitive)
          const lowerSet = new Map<string, string[]>();
          for (const opt of parsedOptions) {
            const lower = opt.toLowerCase();
            if (!lowerSet.has(lower)) lowerSet.set(lower, []);
            lowerSet.get(lower)!.push(opt);
          }
          const dupes = [...lowerSet.entries()].filter(([, arr]) => arr.length > 1);
          if (dupes.length > 0) {
            console.log(`  │  ⚠️ Duplicate options:`);
            for (const [, arr] of dupes) {
              console.log(`  │     ${arr.join(" / ")}`);
            }
            fieldIssues++;
          }

          // Detect alias-created values
          const aliasValues = parsedOptions.filter(o => ["TS", "AP", "TN"].includes(o));
          if (aliasValues.length > 0) {
            console.log(`  │  ⚠️ Alias-created values: ${aliasValues.join(", ")}`);
          }

          // Show all options
          if (parsedOptions.length <= 25) {
            console.log(`  │  Options:   [${parsedOptions.join(", ")}]`);
          } else {
            console.log(`  │  Options:   [${parsedOptions.slice(0, 10).join(", ")}, ... +${parsedOptions.length - 10} more]`);
          }
        }
      }
    }

    // Count values for this field
    const valueCount = await prisma.contactFieldValue.count({ where: { fieldId: f.id } });
    console.log(`  │  Values:    ${valueCount} stored`);
    console.log(`  └────────────────────────`);
  }

  console.log(`\n  Total field issues found: ${fieldIssues}`);

  // =============================
  // 3. RECRUITMENT DATASET READINESS
  // =============================
  console.log("\n═══════════════════════════════════════");
  console.log("  SECTION 3: RECRUITMENT FIELD READINESS");
  console.log("═══════════════════════════════════════\n");

  const requiredFields = [
    { name: "State", key: "state", type: "DROPDOWN" },
    { name: "Country", key: "country", type: "DROPDOWN" },
    { name: "City", key: "city", type: "TEXT" },
    { name: "Address", key: "address", type: "TEXT" },
    { name: "Qualification", key: "qualification", type: "any" },
    { name: "Passout Year", key: "passout_year", type: "any" },
    { name: "College / University", key: "college_university", type: "TEXT" },
    { name: "Stream", key: "stream_branch", type: "TEXT" },
    { name: "Percentage", key: "percentage", type: "NUMBER" },
    { name: "CGPA", key: "cgpa", type: "NUMBER" },
    { name: "Has Laptop", key: "has_laptop", type: "DROPDOWN" },
    { name: "Ready To Work From Office", key: "ready_to_work_from_office", type: "DROPDOWN" },
    { name: "Hyderabad Candidate", key: "hyderabad_candidate", type: "DROPDOWN" },
    { name: "Referrer Name", key: "referrer_name", type: "TEXT" },
  ];

  let fieldReadyCount = 0;
  let fieldMissingCount = 0;

  for (const req of requiredFields) {
    const found = allFields.find(f => f.key === req.key && !f.isArchived);
    if (found) {
      const typeMatch = req.type === "any" || found.type === req.type;
      const status = typeMatch ? "✅ READY" : `⚠️ TYPE MISMATCH (expected ${req.type}, got ${found.type})`;
      console.log(`  ${status}  ${req.name.padEnd(30)} → ${found.key} (${found.type})`);
      if (typeMatch) fieldReadyCount++;
      else fieldMissingCount++;
    } else {
      // Check by display name
      const byName = allFields.find(f => f.displayName.toLowerCase() === req.name.toLowerCase() && !f.isArchived);
      if (byName) {
        console.log(`  ⚠️ KEY MISMATCH  ${req.name.padEnd(30)} → found as "${byName.key}" instead of "${req.key}"`);
        fieldMissingCount++;
      } else {
        console.log(`  ❌ MISSING       ${req.name}`);
        fieldMissingCount++;
      }
    }
  }
  console.log(`\n  Ready: ${fieldReadyCount}/${requiredFields.length}, Issues: ${fieldMissingCount}`);

  // =============================
  // 4. SUMMARY
  // =============================
  console.log("\n═══════════════════════════════════════");
  console.log("  SECTION 4: SUMMARY");
  console.log("═══════════════════════════════════════\n");

  console.log(`  Database Integrity Issues:     ${duplicateEmails.length + orphanMemberships.length + orphanFieldValues.length + archivedWithValues}`);
  console.log(`  Custom Field Issues:           ${fieldIssues}`);
  console.log(`  Recruitment Field Readiness:   ${fieldReadyCount}/${requiredFields.length}`);
  console.log(`  Orphan Contacts (no list):     ${orphanContacts.length}`);
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

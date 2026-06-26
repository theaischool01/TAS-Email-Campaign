import { PrismaClient } from "@prisma/client";
import { CampaignAudienceService } from "../lib/services/campaign-audience.service";

const prisma = new PrismaClient() as any;

async function runProductionAudit() {
  console.log("🔍 RUNNING PRODUCTION AUDIT AGAINST REAL DATABASE...");

  // Find User ID of Saheel/Admin or check existing users
  const users = await prisma.user.findMany({ take: 5 });
  console.log("Users available:", users.map((u: any) => ({ id: u.id, email: u.email })));
  
  // Find Ultimate Dataset Test list
  const list = await prisma.contactList.findFirst({
    where: { name: "Ultimate Dataset Test" }
  });

  if (!list) {
    console.error("❌ ERROR: 'Ultimate Dataset Test' contact list not found!");
    process.exit(1);
  }

  const userId = list.ownerId;
  console.log(`Found list: ${list.name} (ID: ${list.id}), Owner/User ID: ${userId}`);

  // Helpers to count and extract matched/unmatched
  async function runAuditTestCase(name: string, filters: any) {
    console.log(`\n==================================================`);
    console.log(`TEST CASE: ${name}`);
    console.log(`==================================================`);

    const config = {
      listIds: [list.id],
      audienceFilters: filters
    };

    // 1. Get Estimate Count
    const estimateCount = await CampaignAudienceService.getEstimateCount(userId, config);

    // 2. Get Preview Count
    const previewContacts = await CampaignAudienceService.streamRecipients(userId, config, { batchSize: 20 });
    const previewCount = previewContacts.length;

    // 3. Get Launch Stream Count (retrieve all using pagination)
    let launchContacts: any[] = [];
    let cursorId: string | undefined = undefined;
    while (true) {
      const batch = await CampaignAudienceService.streamRecipients(userId, config, { cursorId, batchSize: 100 });
      if (batch.length === 0) break;
      launchContacts.push(...batch);
      cursorId = batch[batch.length - 1].id;
    }
    const launchCount = launchContacts.length;

    console.log(`Estimate Count: ${estimateCount}`);
    console.log(`Preview Count (batchSize=20 limit): ${previewCount}`);
    console.log(`Launch Stream Count (total matching): ${launchCount}`);

    // Verify consistency
    const isConsistent = estimateCount === launchCount;
    console.log(`Is Count Consistent (Estimate == Launch Count)? ${isConsistent ? "✅ YES" : "❌ NO"}`);

    // Get non-matching contacts from the same list
    // Non-matching query: we compile the criteria, but negate it or query list members who are not in the launchContacts set.
    const allListMembers = await prisma.contact.findMany({
      where: {
        lists: { some: { contactListId: list.id } },
        status: "ACTIVE"
      },
      include: {
        customFieldValues: { include: { customField: true } }
      }
    });

    const matchedIds = new Set(launchContacts.map(c => c.id));
    const unmatchedContacts = allListMembers.filter((c: any) => !matchedIds.has(c.id));

    console.log(`\nFIRST 10 MATCHING CONTACTS (out of ${launchCount}):`);
    launchContacts.slice(0, 10).forEach((c, idx) => {
      const stateVal = c.customFieldValues.find((v: any) => v.customField.key === "state")?.textValue || "N/A";
      const qualVal = c.customFieldValues.find((v: any) => v.customField.key === "qualification")?.textValue || "N/A";
      const streamVal = c.customFieldValues.find((v: any) => v.customField.key === "stream")?.textValue || "N/A";
      console.log(`  [${idx+1}] ${c.email} | State: ${stateVal} | Qualification: ${qualVal} | Stream: ${streamVal}`);
    });

    console.log(`\nFIRST 10 NON-MATCHING CONTACTS (out of ${unmatchedContacts.length}):`);
    unmatchedContacts.slice(0, 10).forEach((c, idx) => {
      const stateVal = c.customFieldValues.find((v: any) => v.customField.key === "state")?.textValue || "N/A";
      const qualVal = c.customFieldValues.find((v: any) => v.customField.key === "qualification")?.textValue || "N/A";
      const streamVal = c.customFieldValues.find((v: any) => v.customField.key === "stream")?.textValue || "N/A";
      console.log(`  [${idx+1}] ${c.email} | State: ${stateVal} | Qualification: ${qualVal} | Stream: ${streamVal}`);
    });
  }

  // Define Filter ASTs
  const filterA = {
    conjunction: "AND",
    rules: [
      { type: "RULE", field: "custom.state", operator: "equals", value: "Telangana" }
    ]
  };

  const filterB = {
    conjunction: "AND",
    rules: [
      { type: "RULE", field: "custom.state", operator: "equals", value: "Andhra Pradesh" }
    ]
  };

  const filterC = {
    conjunction: "AND",
    rules: [
      { type: "RULE", field: "custom.state", operator: "equals", value: "Telangana" },
      { type: "RULE", field: "custom.qualification", operator: "equals", value: "Graduation" }
    ]
  };

  const filterD = {
    conjunction: "AND",
    rules: [
      { type: "RULE", field: "custom.state", operator: "equals", value: "Telangana" },
      { type: "RULE", field: "custom.stream", operator: "contains", value: "Computer" }
    ]
  };

  // Run Test Cases
  await runAuditTestCase("A (State = Telangana)", filterA);
  await runAuditTestCase("B (State = Andhra Pradesh)", filterB);
  await runAuditTestCase("C (State = Telangana AND Qualification = Graduation)", filterC);
  await runAuditTestCase("D (State = Telangana AND Stream contains Computer)", filterD);

  // -------------------------------------------------------------
  // Audit all campaigns with audienceFilters != null
  // -------------------------------------------------------------
  console.log(`\n==================================================`);
  console.log(`CAMPAIGN SCHEMA AUDIT`);
  console.log(`==================================================`);
  
  const campaigns = await prisma.campaign.findMany({
    where: {
      audienceFilters: { not: null }
    }
  });

  console.log(`Found ${campaigns.length} campaigns with audienceFilters configured:`);
  campaigns.forEach((c: any) => {
    console.log(`\n- ID: ${c.id}`);
    console.log(`  Name: ${c.name}`);
    console.log(`  Payload: ${JSON.stringify(c.audienceFilters, null, 2)}`);
  });

  process.exit(0);
}

runProductionAudit().catch(err => {
  console.error("Fatal error during audit:", err);
  process.exit(1);
});

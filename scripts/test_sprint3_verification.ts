import { PrismaClient } from "@prisma/client";
import { CampaignAudienceService } from "../lib/services/campaign-audience.service";

const prisma = new PrismaClient() as any;
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q";

async function verifySprint3() {
  console.log("🚀 STARTING SPRINT 3 VERIFICATION TESTS...");

  // Setup test environment (clean up any test data)
  await prisma.campaignActivityLog.deleteMany({
    where: { campaign: { createdBy: TEST_USER_ID, name: { startsWith: "sprint3_" } } }
  });
  await prisma.campaign.deleteMany({
    where: { createdBy: TEST_USER_ID, name: { startsWith: "sprint3_" } }
  });
  await prisma.contact.deleteMany({
    where: { userId: TEST_USER_ID, email: { startsWith: "sprint3_" } }
  });
  await prisma.contactList.deleteMany({
    where: { ownerId: TEST_USER_ID, name: { startsWith: "sprint3_" } }
  });
  await prisma.segment.deleteMany({
    where: { userId: TEST_USER_ID, name: { startsWith: "sprint3_" } }
  });
  await prisma.tag.deleteMany({
    where: { userId: TEST_USER_ID, slug: { startsWith: "sprint3_" } }
  });

  // 1. Create lists
  const testList = await prisma.contactList.create({
    data: {
      name: "sprint3_list_1",
      ownerId: TEST_USER_ID,
    }
  });

  // 2. Create custom fields
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

  // 3. Create Tags
  const tagVip = await prisma.tag.create({
    data: { name: "sprint3_vip", slug: "sprint3_vip", userId: TEST_USER_ID }
  });
  const tagInternal = await prisma.tag.create({
    data: { name: "sprint3_internal", slug: "sprint3_internal", userId: TEST_USER_ID }
  });

  // 4. Create predictable mock contacts
  // C1: List 1, State=Telangana, Tag=VIP
  const c1 = await prisma.contact.create({
    data: {
      email: "sprint3_c1@example.com",
      firstName: "Rahul",
      userId: TEST_USER_ID,
      status: "ACTIVE",
      source: "MANUAL"
    }
  });
  await prisma.contactListMember.create({ data: { contactListId: testList.id, contactId: c1.id } });
  await prisma.contactToContactList.create({ data: { A: c1.id, B: testList.id } });
  await prisma.contactFieldValue.create({ data: { contactId: c1.id, fieldId: cfState.id, textValue: "Telangana" } });
  await prisma.contactTag.create({ data: { contactId: c1.id, tagId: tagVip.id } });

  // C2: List 1, State=Telangana, Tag=VIP AND Tag=Internal
  const c2 = await prisma.contact.create({
    data: {
      email: "sprint3_c2@example.com",
      firstName: "Anil",
      userId: TEST_USER_ID,
      status: "ACTIVE",
      source: "MANUAL"
    }
  });
  await prisma.contactListMember.create({ data: { contactListId: testList.id, contactId: c2.id } });
  await prisma.contactToContactList.create({ data: { A: c2.id, B: testList.id } });
  await prisma.contactFieldValue.create({ data: { contactId: c2.id, fieldId: cfState.id, textValue: "Telangana" } });
  await prisma.contactTag.createMany({
    data: [
      { contactId: c2.id, tagId: tagVip.id },
      { contactId: c2.id, tagId: tagInternal.id }
    ]
  });

  // C3: List 1, State=Karnataka, Tag=VIP
  const c3 = await prisma.contact.create({
    data: {
      email: "sprint3_c3@example.com",
      firstName: " Sneha",
      userId: TEST_USER_ID,
      status: "ACTIVE",
      source: "MANUAL"
    }
  });
  await prisma.contactListMember.create({ data: { contactListId: testList.id, contactId: c3.id } });
  await prisma.contactToContactList.create({ data: { A: c3.id, B: testList.id } });
  await prisma.contactFieldValue.create({ data: { contactId: c3.id, fieldId: cfState.id, textValue: "Karnataka" } });
  await prisma.contactTag.create({ data: { contactId: c3.id, tagId: tagVip.id } });

  // 5. Create Segments
  const segmentTelangana = await prisma.segment.create({
    data: {
      userId: TEST_USER_ID,
      name: "sprint3_segment_telangana",
      criteria: {
        conjunction: "AND",
        rules: [
          { type: "RULE", field: "custom.state", operator: "equals", value: "Telangana" }
        ]
      }
    }
  });

  const segmentKarnataka = await prisma.segment.create({
    data: {
      userId: TEST_USER_ID,
      name: "sprint3_segment_karnataka",
      criteria: {
        conjunction: "AND",
        rules: [
          { type: "RULE", field: "custom.state", operator: "equals", value: "Karnataka" }
        ]
      }
    }
  });

  console.log("✅ Mock environment configured.");

  try {
    // -------------------------------------------------------------
    // Test 1: List A + Segment Telangana + Exclude tag Internal
    // Formula: (List 1) AND (Telangana) AND (NOT Internal)
    // Matches: c1 (Rahul) only, as c2 is excluded by "sprint3_internal" tag.
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Hybrid targeting: (List A ∩ Segment Telangana) \\ Excluded Tags ---");
    const count1 = await CampaignAudienceService.getEstimateCount(TEST_USER_ID, {
      listIds: [testList.id],
      segments: [segmentTelangana],
      excludedTags: ["sprint3_internal"]
    });
    console.log("Estimated Recipients Count:", count1);
    if (count1 !== 1) {
      throw new Error(`Test 1 Failed: expected estimate count to be 1, got ${count1}`);
    }

    const preview1 = await CampaignAudienceService.streamRecipients(TEST_USER_ID, {
      listIds: [testList.id],
      segments: [segmentTelangana],
      excludedTags: ["sprint3_internal"]
    }, { batchSize: 20 });
    
    console.log("Preview Contacts matching count:", preview1.length);
    if (preview1.length !== 1 || preview1[0].email !== "sprint3_c1@example.com") {
      throw new Error(`Test 1 Failed: preview list did not match expected. Got: ${JSON.stringify(preview1)}`);
    }
    console.log("✅ Test 1 Passed.");

    // -------------------------------------------------------------
    // Test 2: Multiple Segments (Telangana OR Karnataka)
    // Matches: c1 (Telangana), c2 (Telangana), c3 (Karnataka) -> Count = 3
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Multiple Segments Conjunction (OR Union) ---");
    const count2 = await CampaignAudienceService.getEstimateCount(TEST_USER_ID, {
      listIds: [testList.id],
      segments: [segmentTelangana, segmentKarnataka]
    });
    console.log("Union Segment Estimate Count:", count2);
    if (count2 !== 3) {
      throw new Error(`Test 2 Failed: expected estimate count to be 3, got ${count2}`);
    }
    console.log("✅ Test 2 Passed.");

  } finally {
    // Tear down test resources
    await prisma.campaignActivityLog.deleteMany({
      where: { campaign: { createdBy: TEST_USER_ID, name: { startsWith: "sprint3_" } } }
    });
    await prisma.campaign.deleteMany({
      where: { createdBy: TEST_USER_ID, name: { startsWith: "sprint3_" } }
    });
    await prisma.contactFieldValue.deleteMany({
      where: { contact: { userId: TEST_USER_ID, email: { startsWith: "sprint3_" } } }
    });
    await prisma.contactTag.deleteMany({
      where: { contact: { userId: TEST_USER_ID, email: { startsWith: "sprint3_" } } }
    });
    await prisma.contact.deleteMany({
      where: { userId: TEST_USER_ID, email: { startsWith: "sprint3_" } }
    });
    await prisma.contactListMember.deleteMany({
      where: { contactList: { ownerId: TEST_USER_ID, name: { startsWith: "sprint3_" } } }
    });
    await prisma.contactList.deleteMany({
      where: { ownerId: TEST_USER_ID, name: { startsWith: "sprint3_" } }
    });
    await prisma.segment.deleteMany({
      where: { userId: TEST_USER_ID, name: { startsWith: "sprint3_" } }
    });
    await prisma.tag.deleteMany({
      where: { userId: TEST_USER_ID, slug: { startsWith: "sprint3_" } }
    });
  }
}

verifySprint3()
  .then(() => {
    console.log("\n🎉 ALL SPRINT 3 VERIFICATION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ SPRINT 3 VERIFICATION ENCOUNTERED ERROR:", err);
    process.exit(1);
  });

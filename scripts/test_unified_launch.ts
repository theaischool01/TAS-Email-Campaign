import { PrismaClient } from "@prisma/client";
import { CampaignLaunchService } from "../lib/services/campaign-launch-service";
import { QueueService } from "../lib/services/queue.service";

const prisma = new PrismaClient() as any;
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q"; // Saheel's User ID

async function runTests() {
  console.log("🚀 STARTING UNIFIED CAMPAIGN LAUNCH SERVICE INTEGRATION TESTS...");

  // Setup test environment (clean up any test data)
  await prisma.campaignActivityLog.deleteMany({
    where: { campaign: { createdBy: TEST_USER_ID, name: { startsWith: "test_launch_" } } }
  });
  await prisma.campaign.deleteMany({
    where: { createdBy: TEST_USER_ID, name: { startsWith: "test_launch_" } }
  });
  await prisma.contact.deleteMany({
    where: { userId: TEST_USER_ID, email: { startsWith: "test_launch_email_" } }
  });
  await prisma.contactList.deleteMany({
    where: { ownerId: TEST_USER_ID, name: { startsWith: "test_launch_list_" } }
  });
  await prisma.segment.deleteMany({
    where: { userId: TEST_USER_ID, name: { startsWith: "test_launch_segment_" } }
  });

  // Create a base contact list and active contacts
  const testList = await prisma.contactList.create({
    data: {
      name: "test_launch_list_1",
      ownerId: TEST_USER_ID,
    }
  });

  const contact1 = await prisma.contact.create({
    data: {
      userId: TEST_USER_ID,
      email: "test_launch_email_1@example.com",
      firstName: "Alpha",
      status: "ACTIVE",
    }
  });

  await prisma.contactListMember.create({
    data: {
      contactListId: testList.id,
      contactId: contact1.id,
    }
  });
  await prisma.contactToContactList.create({
    data: {
      A: contact1.id,
      B: testList.id
    }
  });

  // Create template
  const template = await prisma.emailTemplate.create({
    data: {
      name: "test_launch_template",
      createdBy: TEST_USER_ID,
      html: "<h1>Hello {{firstName}}!</h1>",
    }
  });

  // Mock QueueService.enqueueBatch to spy on enqueued messages
  let enqueuedBatches: any[][] = [];
  const originalEnqueueBatch = QueueService.enqueueBatch;
  QueueService.enqueueBatch = async (batch: any[]) => {
    enqueuedBatches.push(batch);
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Manual Launch of a DRAFT Campaign
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Manual Launch of DRAFT Campaign ---");
    const campaign1 = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_launch_campaign_1",
        subject: "Subject 1",
        status: "DRAFT",
        templateId: template.id,
        recipientLists: {
          create: {
            contactListId: testList.id
          }
        }
      }
    });

    enqueuedBatches = [];
    const result1 = await CampaignLaunchService.launchCampaign({
      campaignId: campaign1.id,
      triggeredBy: "MANUAL",
    });

    console.log("Result 1:", result1);
    if (!result1.success || result1.recipientCount !== 1) {
      throw new Error(`Test 1 Failed: launchCampaign should have succeeded. Got: ${JSON.stringify(result1)}`);
    }

    const campaign1FromDb = await prisma.campaign.findUnique({ where: { id: campaign1.id } });
    if (campaign1FromDb.status !== "SENT") {
      throw new Error(`Expected campaign status to be SENT, got ${campaign1FromDb.status}`);
    }

    if (enqueuedBatches.length !== 1 || enqueuedBatches[0][0].recipient.email !== "test_launch_email_1@example.com") {
      throw new Error("Test 1 Failed: SQS enqueuing payload did not match.");
    }
    console.log("✅ Test 1 Passed: Manual DRAFT campaign successfully launched and enqueued.");

    // -------------------------------------------------------------
    // Test 2: Scheduled Launch of a SCHEDULED Campaign
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Scheduled Launch of SCHEDULED Campaign ---");
    const campaign2 = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_launch_campaign_2",
        subject: "Subject 2",
        status: "SCHEDULED",
        templateId: template.id,
        recipientLists: {
          create: {
            contactListId: testList.id
          }
        }
      }
    });

    enqueuedBatches = [];
    const result2 = await CampaignLaunchService.launchCampaign({
      campaignId: campaign2.id,
      triggeredBy: "SCHEDULED",
    });

    console.log("Result 2:", result2);
    if (!result2.success || result2.recipientCount !== 1) {
      throw new Error(`Test 2 Failed: launchCampaign should have succeeded. Got: ${JSON.stringify(result2)}`);
    }

    const campaign2FromDb = await prisma.campaign.findUnique({ where: { id: campaign2.id } });
    if (campaign2FromDb.status !== "SENT") {
      throw new Error(`Expected campaign status to be SENT, got ${campaign2FromDb.status}`);
    }
    console.log("✅ Test 2 Passed: Scheduled campaign successfully launched and enqueued.");

    // -------------------------------------------------------------
    // Test 3: Lock Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Lock Protection ---");
    const campaign3 = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_launch_campaign_3",
        subject: "Subject 3",
        status: "DRAFT",
        templateId: template.id,
        recipientLists: {
          create: {
            contactListId: testList.id
          }
        }
      }
    });

    // Run concurrent launch attempts
    const [la, lb] = await Promise.all([
      CampaignLaunchService.launchCampaign({ campaignId: campaign3.id, triggeredBy: "MANUAL" }),
      CampaignLaunchService.launchCampaign({ campaignId: campaign3.id, triggeredBy: "MANUAL" }),
    ]);

    console.log("Request A Result:", la);
    console.log("Request B Result:", lb);

    const successCount = [la.success, lb.success].filter(Boolean).length;
    if (successCount !== 1) {
      throw new Error(`Test 3 Failed: expected exactly 1 concurrent launch to succeed, got ${successCount}`);
    }
    console.log("✅ Test 3 Passed: Lock protection successfully blocked concurrent launches.");

    // -------------------------------------------------------------
    // Test 4: Segment + Custom Fields
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Segment and Custom Fields Resolution ---");

    // Add a custom field
    const fieldKey = "test_launch_custom_state";
    await prisma.contactCustomField.deleteMany({ where: { userId: TEST_USER_ID, key: fieldKey } });
    const customField = await prisma.contactCustomField.create({
      data: {
        userId: TEST_USER_ID,
        key: fieldKey,
        displayName: "State",
        type: "TEXT",
      }
    });

    // Associate value with contact1
    await prisma.contactFieldValue.create({
      data: {
        contactId: contact1.id,
        fieldId: customField.id,
        textValue: "Telangana"
      }
    });

    // Create Tag "VIP"
    const tag = await prisma.tag.create({
      data: {
        name: "VIP",
        slug: "vip",
        userId: TEST_USER_ID,
      }
    });
    await prisma.contactTag.create({
      data: {
        contactId: contact1.id,
        tagId: tag.id,
      }
    });

    // Create a Segment: Custom Field State == Telangana AND Tag == VIP
    const segment = await prisma.segment.create({
      data: {
        userId: TEST_USER_ID,
        name: "test_launch_segment_vip_telangana",
        criteria: {
          conjunction: "AND",
          rules: [
            {
              type: "RULE",
              field: `custom.${fieldKey}`,
              operator: "equals",
              value: "Telangana",
            },
            {
              type: "RULE",
              field: "contact.tags",
              operator: "contains_any",
              value: ["vip"]
            }
          ]
        }
      }
    });

    // Create campaign using segment
    const campaign4 = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_launch_campaign_4",
        subject: "Subject 4",
        status: "DRAFT",
        templateId: template.id,
        recipientSegments: {
          create: {
            segmentId: segment.id
          }
        }
      }
    });

    enqueuedBatches = [];
    const result4 = await CampaignLaunchService.launchCampaign({
      campaignId: campaign4.id,
      triggeredBy: "MANUAL",
    });

    console.log("Result 4:", result4);
    if (!result4.success || result4.recipientCount !== 1) {
      throw new Error(`Test 4 Failed: should have matched contact1. Got: ${JSON.stringify(result4)}`);
    }

    const enqueuedFields = enqueuedBatches[0][0].recipient.customFields;
    console.log("Hydrated custom fields in SQS message:", enqueuedFields);
    if (enqueuedFields[fieldKey] !== "Telangana") {
      throw new Error(`Test 4 Failed: custom field state not hydrated correctly. Got ${JSON.stringify(enqueuedFields)}`);
    }
    console.log("✅ Test 4 Passed: Segment matching & custom fields hydration completed successfully.");

    // -------------------------------------------------------------
    // Test 5: Failure Handling (SQS fails)
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Failure Handling (SQS enqueuing failure) ---");
    const campaign5 = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_launch_campaign_5",
        subject: "Subject 5",
        status: "DRAFT",
        templateId: template.id,
        recipientLists: {
          create: {
            contactListId: testList.id
          }
        }
      }
    });

    // Make QueueService fail
    QueueService.enqueueBatch = async () => {
      throw new Error("Simulated SQS Connection Timeout Failure");
    };

    const result5 = await CampaignLaunchService.launchCampaign({
      campaignId: campaign5.id,
      triggeredBy: "MANUAL"
    });

    console.log("Result 5:", result5);
    if (result5.success) {
      throw new Error("Test 5 Failed: expected launchCampaign to return success = false due to SQS failure.");
    }

    const campaign5FromDb = await prisma.campaign.findUnique({ where: { id: campaign5.id } });
    if (campaign5FromDb.status !== "FAILED") {
      throw new Error(`Expected campaign status to update to FAILED, got: ${campaign5FromDb.status}`);
    }

    const failureLog = await prisma.campaignActivityLog.findFirst({
      where: { campaignId: campaign5.id, action: "CAMPAIGN_FAILED" }
    });
    console.log("Failure Activity Log Metadata:", failureLog?.metadata);
    if (!failureLog || !(failureLog.metadata as any).reason.includes("Simulated SQS")) {
      throw new Error("Test 5 Failed: expected failure activity log with correct reason.");
    }
    console.log("✅ Test 5 Passed: Queueing failure correctly updated campaign status to FAILED.");

  } finally {
    // Restore QueueService.enqueueBatch
    QueueService.enqueueBatch = originalEnqueueBatch;

    // Tear down test resources
    await prisma.campaignActivityLog.deleteMany({
      where: { campaign: { createdBy: TEST_USER_ID, name: { startsWith: "test_launch_" } } }
    });
    await prisma.campaign.deleteMany({
      where: { createdBy: TEST_USER_ID, name: { startsWith: "test_launch_" } }
    });
    await prisma.contactFieldValue.deleteMany({
      where: { contact: { userId: TEST_USER_ID, email: { startsWith: "test_launch_email_" } } }
    });
    await prisma.contactTag.deleteMany({
      where: { contact: { userId: TEST_USER_ID, email: { startsWith: "test_launch_email_" } } }
    });
    await prisma.contact.deleteMany({
      where: { userId: TEST_USER_ID, email: { startsWith: "test_launch_email_" } }
    });
    await prisma.contactList.deleteMany({
      where: { ownerId: TEST_USER_ID, name: { startsWith: "test_launch_list_" } }
    });
    await prisma.segment.deleteMany({
      where: { userId: TEST_USER_ID, name: { startsWith: "test_launch_segment_" } }
    });
    await prisma.tag.deleteMany({
      where: { userId: TEST_USER_ID, slug: "vip" }
    });
    await prisma.emailTemplate.delete({
      where: { id: template.id }
    });
  }
}

runTests()
  .then(() => {
    console.log("\n🎉 ALL UNIFIED CAMPAIGN LAUNCH TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ TESTS RUN ENCOUNTERED ERROR:", err);
    process.exit(1);
  });

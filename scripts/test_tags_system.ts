import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient() as any
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q" // Saheel's User ID

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

async function runTests() {
  console.log("🚀 STARTING TAG SYSTEM INTEGRATION & VERIFICATION TESTS...")

  // Clean up any potential stale records first
  const cleanup = async () => {
    await prisma.campaignActivityLog.deleteMany({
      where: { campaign: { createdBy: TEST_USER_ID } }
    })
    await prisma.campaign.deleteMany({
      where: { createdBy: TEST_USER_ID, name: { startsWith: "Test Campaign" } }
    })
    await prisma.contactListMember.deleteMany({
      where: { contact: { userId: TEST_USER_ID } }
    })
    await prisma.contactToContactList.deleteMany({
      where: { contacts: { userId: TEST_USER_ID } }
    })
    await prisma.contactTag.deleteMany({
      where: { contact: { userId: TEST_USER_ID } }
    })
    await prisma.tag.deleteMany({
      where: { userId: TEST_USER_ID }
    })
    await prisma.contact.deleteMany({
      where: { userId: TEST_USER_ID, email: { startsWith: "test_tag_" } }
    })
    await prisma.contactList.deleteMany({
      where: { ownerId: TEST_USER_ID, name: { startsWith: "Test List" } }
    })
  }

  await cleanup()

  // 1. Create tags
  console.log("\n1️⃣ Creating test tags...")
  const vipTag = await prisma.tag.create({
    data: { name: "VIP", slug: "vip", userId: TEST_USER_ID }
  })
  const studentTag = await prisma.tag.create({
    data: { name: "Student", slug: "student", userId: TEST_USER_ID }
  })
  const internalTag = await prisma.tag.create({
    data: { name: "Internal", slug: "internal", userId: TEST_USER_ID }
  })
  console.log("Tags created:", { vipTag, studentTag, internalTag })

  // 2. Create list and contacts
  console.log("\n2️⃣ Creating contacts and lists...")
  const list = await prisma.contactList.create({
    data: { name: "Test List 1", ownerId: TEST_USER_ID }
  })

  // Contact 1: VIP and Student
  const contact1 = await prisma.contact.create({
    data: { email: "test_tag_1@example.com", userId: TEST_USER_ID, firstName: "Alpha", status: "ACTIVE" }
  })
  // Contact 2: Student only
  const contact2 = await prisma.contact.create({
    data: { email: "test_tag_2@example.com", userId: TEST_USER_ID, firstName: "Beta", status: "ACTIVE" }
  })
  // Contact 3: VIP and Internal
  const contact3 = await prisma.contact.create({
    data: { email: "test_tag_3@example.com", userId: TEST_USER_ID, firstName: "Gamma", status: "ACTIVE" }
  })
  // Contact 4: No tags
  const contact4 = await prisma.contact.create({
    data: { email: "test_tag_4@example.com", userId: TEST_USER_ID, firstName: "Delta", status: "ACTIVE" }
  })

  // Add all to list
  for (const c of [contact1, contact2, contact3, contact4]) {
    await prisma.contactListMember.create({
      data: { contactListId: list.id, contactId: c.id }
    })
    await prisma.contactToContactList.create({
      data: { A: c.id, B: list.id }
    })
  }

  // 3. Assign tags to contacts
  console.log("\n3️⃣ Assigning tags...")
  await prisma.contactTag.createMany({
    data: [
      { contactId: contact1.id, tagId: vipTag.id },
      { contactId: contact1.id, tagId: studentTag.id },
      { contactId: contact2.id, tagId: studentTag.id },
      { contactId: contact3.id, tagId: vipTag.id },
      { contactId: contact3.id, tagId: internalTag.id }
    ]
  })
  console.log("Tag assignments created successfully.")

  // 4. Fetch list tags (aggregate query from fixed route.ts)
  console.log("\n4️⃣ Fetching list tags aggregation...")
  const rawTags: { id: string; name: string; count: number }[] = await prisma.$queryRawUnsafe(`
    SELECT t.id AS id, t.name AS name, COUNT(*)::integer AS count
    FROM contact_tags ct
    JOIN tags t ON t.id = ct."tagId"
    JOIN contacts c ON c.id = ct."contactId"
    JOIN contact_list_members m ON m."contactId" = c.id
    WHERE m."contactListId" = $1 AND c.status = 'ACTIVE'
    GROUP BY t.id, t.name
    ORDER BY count DESC
  `, list.id)

  console.log("Aggregated tags result:", rawTags)
  
  // Assertions
  const vipAgg = rawTags.find(t => t.name === "VIP")
  const studentAgg = rawTags.find(t => t.name === "Student")
  const internalAgg = rawTags.find(t => t.name === "Internal")

  if (!vipAgg || vipAgg.count !== 2) throw new Error("Aggregation failed: Expected 2 VIPs, got " + vipAgg?.count)
  if (!studentAgg || studentAgg.count !== 2) throw new Error("Aggregation failed: Expected 2 Students, got " + studentAgg?.count)
  if (!internalAgg || internalAgg.count !== 1) throw new Error("Aggregation failed: Expected 1 Internal, got " + internalAgg?.count)
  
  console.log("✅ Tag Aggregation query check passed.")

  // 5. Test Campaign scheduling with Included / Excluded Tags
  console.log("\n5️⃣ Testing campaign schedule recipient computation simulation...")

  const simulateScheduling = async (includedTagsStr: string, excludedTagsStr: string) => {
    const includedTags = includedTagsStr
      ? includedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : []

    const excludedTags = excludedTagsStr
      ? excludedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : []

    // Query mimicking the schedule endpoint logic
    const members = await prisma.contactListMember.findMany({
      where: { contactListId: { in: [list.id] } },
      select: {
        contact: {
          select: {
            id: true,
            email: true,
            status: true,
            contactTags: {
              select: {
                tag: {
                  select: {
                    name: true,
                    slug: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const recipients: string[] = []

    for (const member of members) {
      const contact = member.contact
      if (!contact || contact.status !== "ACTIVE") continue

      const contactTags = [
        ...new Set(
          (contact.contactTags || [])
            .flatMap((ct: any) => [
              ct.tag?.name?.trim().toLowerCase(),
              ct.tag?.slug?.trim().toLowerCase(),
            ])
            .filter(Boolean)
        )
      ]

      if (includedTags.length > 0) {
        const hasIncludedTag = contactTags.some((t: string) => includedTags.includes(t))
        if (!hasIncludedTag) continue
      }

      if (excludedTags.length > 0) {
        const hasExcludedTag = contactTags.some((t: string) => excludedTags.includes(t))
        if (hasExcludedTag) continue
      }

      recipients.push(contact.email)
    }

    return recipients
  }

  // Scenario A: Include VIP (should match contact 1 and contact 3)
  const recsA = await simulateScheduling("VIP", "")
  console.log("Include VIP matches:", recsA)
  if (recsA.length !== 2 || !recsA.includes("test_tag_1@example.com") || !recsA.includes("test_tag_3@example.com")) {
    throw new Error("Scenario A (Include VIP) failed: Expected test_tag_1 & test_tag_3, got " + JSON.stringify(recsA))
  }

  // Scenario B: Include VIP, Exclude Internal (should match contact 1 only, because contact 3 has Internal)
  const recsB = await simulateScheduling("VIP", "Internal")
  console.log("Include VIP + Exclude Internal matches:", recsB)
  if (recsB.length !== 1 || recsB[0] !== "test_tag_1@example.com") {
    throw new Error("Scenario B (Include VIP, Exclude Internal) failed: Expected only test_tag_1, got " + JSON.stringify(recsB))
  }

  // Scenario C: No tag filters (should match all active contacts: 1, 2, 3, 4)
  const recsC = await simulateScheduling("", "")
  console.log("No filters matches:", recsC)
  if (recsC.length !== 4) {
    throw new Error("Scenario C (No filters) failed: Expected 4 recipients, got " + recsC.length)
  }

  console.log("✅ Campaign recipient tag-filtering simulation passed.")

  // 6. Remove tag from contact
  console.log("\n6️⃣ Removing tag from contact...")
  // Simulates contact PATCH delta tag updates: removing Student tag from contact 1 (leaving only VIP)
  await prisma.contactTag.deleteMany({
    where: { contactId: contact1.id, tagId: studentTag.id }
  })
  
  const tagsForContact1 = await prisma.contactTag.findMany({
    where: { contactId: contact1.id },
    include: { tag: true }
  })
  console.log("Contact 1 remaining tags:", tagsForContact1.map((ct: any) => ct.tag.name))
  if (tagsForContact1.length !== 1 || tagsForContact1[0].tag.name !== "VIP") {
    throw new Error("Failed to remove tag from contact.")
  }
  console.log("✅ Tag removal from contact passed.")

  // 7. Delete tag
  console.log("\n7️⃣ Deleting tag from tag library...")
  // Deleting VIP tag (onDelete: Cascade will delete it from contactTags of contact1 and contact3)
  await prisma.tag.delete({
    where: { id: vipTag.id }
  })

  const remainingLinks = await prisma.contactTag.findMany({
    where: { tagId: vipTag.id }
  })
  console.log("Remaining links referencing VIP tag:", remainingLinks.length)
  if (remainingLinks.length !== 0) {
    throw new Error("Tag deletion did not cascade to contactTags join table.")
  }
  console.log("✅ Tag deletion cascade check passed.")

  // Clean up
  console.log("\n🧹 Cleaning up test database records...")
  await cleanup()
  console.log("✅ Clean up finished.")
}

runTests()
  .then(() => {
    console.log("\n🎉 ALL TAG SYSTEM ASSERTIONS PASSED SUCCESSFULLY!")
    process.exit(0)
  })
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED:", err)
    process.exit(1)
  })

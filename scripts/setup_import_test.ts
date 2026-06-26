import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testScenario() {
  console.log('--- PRE-TEST DB CLEANUP / SEEDING ---')
  const ownerId = 'cmqav8tnn0000tahoebfdik6q' // Saheel's actual user ID
  
  // 1. Ensure Sandbox Test list exists
  let list = await prisma.contactList.findFirst({
    where: { name: 'SandBox Test', ownerId }
  })
  if (!list) {
    list = await prisma.contactList.create({
      data: { name: 'SandBox Test', ownerId }
    })
  }

  // 2. Ensure Jarvis list exists
  let jarvisList = await prisma.contactList.findFirst({
    where: { name: 'jarvis', ownerId }
  })
  if (!jarvisList) {
    jarvisList = await prisma.contactList.create({
      data: { name: 'jarvis', ownerId }
    })
  }

  // 3. Ensure john@gmail.com exists with tags "new" in Jarvis list but not Sandbox Test
  const email = 'john@gmail.com'
  let john = await prisma.contact.findFirst({ where: { email, userId: ownerId } })
  if (!john) {
    john = await prisma.contact.create({
      data: {
        email,
        userId: ownerId,
        status: 'ACTIVE',
        source: 'MANUAL'
      }
    })
  }

  // Ensure Tag "new" exists
  let tag = await prisma.tag.findUnique({
    where: {
      userId_slug: {
        userId: ownerId,
        slug: 'new'
      }
    }
  })
  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        name: 'new',
        slug: 'new',
        userId: ownerId,
        color: '#3B82F6'
      }
    })
  }

  // Link Tag to John
  const contactTag = await prisma.contactTag.findUnique({
    where: {
      contactId_tagId: {
        contactId: john.id,
        tagId: tag.id
      }
    }
  })
  if (!contactTag) {
    await prisma.contactTag.create({
      data: {
        contactId: john.id,
        tagId: tag.id
      }
    })
  }

  // Make sure John belongs to Jarvis list
  const jarvisMember = await prisma.contactListMember.findFirst({
    where: { contactId: john.id, contactListId: jarvisList.id }
  })
  if (!jarvisMember) {
    await prisma.contactListMember.create({ data: { contactId: john.id, contactListId: jarvisList.id } })
    await prisma.contactToContactList.create({ data: { A: john.id, B: jarvisList.id } })
  }

  // Make sure John DOES NOT belong to Sandbox Test list initially
  await prisma.contactListMember.deleteMany({
    where: { contactId: john.id, contactListId: list.id }
  })
  await prisma.contactToContactList.deleteMany({
    where: { A: john.id, B: list.id }
  })

  console.log('Seeded john@gmail.com with tag "new" in "jarvis" list.')
}

testScenario().catch(console.error).finally(() => prisma.$disconnect())

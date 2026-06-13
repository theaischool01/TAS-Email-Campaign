import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const emails = [
    'saheelyadav670@gmail.com',
    'saheelyadav67@gmail.com',
    'official@campaign.theaischool.co'
  ]

  console.log('--- DATABASE VERIFICATION ---')
  for (const email of emails) {
    const contact = await prisma.contact.findFirst({
      where: { email }
    })

    if (!contact) {
      console.log(`Email: ${email} -> NOT FOUND`)
      continue
    }

    // Check list memberships
    const listMembers = await prisma.contactListMember.findMany({
      where: { contactId: contact.id },
      include: { contactList: true }
    })

    const relationMembers = await prisma.$queryRawUnsafe(`
      SELECT * FROM "_ContactToContactList" WHERE "A" = $1
    `, contact.id) as any[]

    console.log(`Email: ${email}`)
    console.log(`  Contact ID: ${contact.id}`)
    console.log(`  Tags: ${JSON.stringify(contact.tags)}`)
    console.log(`  contact_list_members memberships:`, listMembers.map((m: any) => ({ listId: m.contactListId, listName: m.contactList.name })))
    console.log(`  _ContactToContactList memberships:`, relationMembers.map((m: any) => ({ A: m.A, B: m.B })))
    console.log('-----------------------------')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

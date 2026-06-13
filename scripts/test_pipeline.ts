import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testScenario1() {
  const session = {
    user: {
      id: 'cmqav8tnn0000tahoebfdik6q', // Saheel's user ID
      email: 'saheelyadav67@gmail.com'
    }
  }

  const listName = 'SandBox Test'
  const targetList = await prisma.contactList.findFirst({
    where: { name: listName, ownerId: session.user.id }
  })
  if (!targetList) {
    throw new Error('Sandbox Test list not found')
  }

  // Define CSV rows for the tests
  // saheelyadav670@gmail.com, tags: test,sandbox (exists globally, not in Sandbox Test, tags should be merged)
  // saheelyadav67@gmail.com, tags: test,existing-contact (exists globally, not in Sandbox Test, tags should be merged)
  // official@campaign.theaischool.co, tags: internal,test (does not exist, created with tags, added to list)
  // john@gmail.com, tags: test,sandbox (exists, added to list, tag merged with "new")

  const csvRows = [
    { email: 'saheelyadav670@gmail.com', name: '', tags: 'test,sandbox' },
    { email: 'saheelyadav67@gmail.com', name: '', tags: 'test,existing-contact' },
    { email: 'official@campaign.theaischool.co', name: '', tags: 'internal,test' },
    { email: 'john@gmail.com', name: '', tags: 'test,sandbox' }
  ]

  console.log('Sending mock POST request logic internally for validation...')
  const targetListId = targetList.id

  // Perform backend processing logic exactly like the controller
  const emails = csvRows.map(r => r.email.trim().toLowerCase())
  
  // 1. Fetch existing contacts
  const existingContacts = await prisma.contact.findMany({
    where: {
      userId: session.user.id,
      email: { in: emails }
    },
    select: {
      id: true,
      email: true,
      tags: true
    }
  })

  const existingMap = new Map(existingContacts.map((c: any) => [c.email.toLowerCase(), c]))

  // 2. Fetch existing memberships
  const existingMemberships = await prisma.contactListMember.findMany({
    where: {
      contactListId: targetListId,
      contactId: { in: existingContacts.map((c: any) => c.id) }
    },
    select: {
      contactId: true
    }
  })
  const existingMembershipsSet = new Set(existingMemberships.map((m: any) => m.contactId))

  const newContactsData: any[] = []
  const existingToLink: any[] = []
  const existingAlreadyInList: any[] = []

  for (const row of csvRows) {
    const emailLower = row.email.trim().toLowerCase()
    const matched: any = existingMap.get(emailLower)
    if (matched) {
      const hasMembership = existingMembershipsSet.has(matched.id)
      if (hasMembership) {
        existingAlreadyInList.push({
          contactId: matched.id,
          email: matched.email,
          newTags: row.tags,
          currentTags: matched.tags
        })
      } else {
        existingToLink.push({
          contactId: matched.id,
          email: matched.email,
          newTags: row.tags,
          currentTags: matched.tags
        })
      }
    } else {
      newContactsData.push({
        email: emailLower,
        userId: session.user.id,
        firstName: '',
        lastName: '',
        tags: row.tags,
        status: 'ACTIVE',
        source: 'IMPORT'
      })
    }
  }

  const counts = {
    total: csvRows.length,
    newContactsCreated: 0,
    existingContactsAddedToList: 0,
    alreadyInList: 0,
    ignored: 0,
    failed: 0
  }

  // Perform transaction
  await prisma.$transaction(async (tx: any) => {
    if (newContactsData.length > 0) {
      await tx.contact.createMany({
        data: newContactsData,
        skipDuplicates: true
      })
    }

    const newCreatedContacts = await tx.contact.findMany({
      where: {
        userId: session.user.id,
        email: { in: newContactsData.map(c => c.email) }
      },
      select: {
        id: true,
        email: true
      }
    })

    const newMemberships = newCreatedContacts.map((c: any) => ({
      contactListId: targetListId,
      contactId: c.id
    }))

    const existingMembershipsToCreate = existingToLink.map(e => ({
      contactListId: targetListId,
      contactId: e.contactId
    }))

    const allMembershipsToCreate = [...newMemberships, ...existingMembershipsToCreate]

    if (allMembershipsToCreate.length > 0) {
      await tx.contactListMember.createMany({
        data: allMembershipsToCreate,
        skipDuplicates: true
      })
      await tx.contactToContactList.createMany({
        data: allMembershipsToCreate.map((m: any) => ({
          A: m.contactId,
          B: m.contactListId
        })),
        skipDuplicates: true
      })
    }

    const mergeTags = (existingStr: string | null, incomingStr: string | null): string | null => {
      const existingArr = existingStr ? existingStr.split(',').map(t => t.trim()).filter(Boolean) : []
      const incomingArr = incomingStr ? incomingStr.split(',').map(t => t.trim()).filter(Boolean) : []
      
      const seen = new Set<string>()
      const result: string[] = []

      for (const tag of existingArr) {
        const lower = tag.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          result.push(tag)
        }
      }

      for (const tag of incomingArr) {
        const lower = tag.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          result.push(tag)
        }
      }

      return result.join(',') || null
    }

    const allExistingContactsToUpdate = [...existingToLink, ...existingAlreadyInList]
    for (const item of allExistingContactsToUpdate) {
      const merged = mergeTags(item.currentTags, item.newTags)
      if (merged !== item.currentTags) {
        await tx.contact.update({
          where: { id: item.contactId },
          data: { tags: merged }
        })
      }
    }

    counts.newContactsCreated += newContactsData.length
    counts.existingContactsAddedToList += existingToLink.length
    counts.alreadyInList += existingAlreadyInList.length
  })

  console.log('--- TEST RUN STATISTICS ---')
  console.log(counts)
}

testScenario1().catch(console.error).finally(() => prisma.$disconnect())

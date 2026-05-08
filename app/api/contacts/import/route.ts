import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const targetListId = formData.get("targetListId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type and size
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 })
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 25MB" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
    }

    // Skip header row
    const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase())
    const dataLines = lines.slice(1)
    
    const results = []
    let addedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let duplicateCount = 0

    // Create column mapping
    const columnMap = {
      email: headers.indexOf('email'),
      firstName: headers.indexOf('firstname') || headers.indexOf('first name'),
      lastName: headers.indexOf('lastname') || headers.indexOf('last name'),
      phone: headers.indexOf('phone'),
      company: headers.indexOf('company'),
      city: headers.indexOf('city'),
      tags: headers.indexOf('tags')
    }

    // Process contacts
    for (const line of dataLines) {
      if (!line.trim()) continue

      const values = line.split(',').map(v => v.trim())
      const email = values[columnMap.email]?.trim().toLowerCase()
      
      if (!email || !email.includes('@')) {
        skippedCount++
        results.push({
          success: false,
          message: `Invalid email: ${values[columnMap.email] || 'missing'}`,
          details: 'Email is required and must be valid'
        })
        continue
      }

      try {
        // Check for duplicate email
        const existingContact = await prisma.contact.findUnique({
          where: { email }
        })

        if (existingContact) {
          duplicateCount++
          results.push({
            success: false,
            message: `Duplicate email: ${email}`,
            details: 'Contact with this email already exists'
          })
          continue
        }

        // Create new contact with all fields
        const newContact = await prisma.contact.create({
          data: {
            email,
            firstName: values[columnMap.firstName]?.trim() || null,
            lastName: values[columnMap.lastName]?.trim() || null,
            phone: values[columnMap.phone]?.trim() || null,
            company: values[columnMap.company]?.trim() || null,
            city: values[columnMap.city]?.trim() || null,
            tags: values[columnMap.tags]?.trim() || null,
            status: "ACTIVE",
            source: "IMPORT"
          }
        })

        // Add to specified list or default list
        let listId = targetListId
        if (!listId) {
          const defaultList = await prisma.contactList.findFirst({
            where: {
              ownerId: session.user.id,
              name: "Imported Contacts"
            }
          })

          if (!defaultList) {
            const newList = await prisma.contactList.create({
              data: {
                name: "Imported Contacts",
                description: "Contacts imported from CSV file",
                ownerId: session.user.id
                if (!existingContact) {
                  const newContact = await prisma.contact.create({
                    data: {
                      email: contactEmail,
                      firstName: contactValues[1]?.trim() || null,
                      lastName: contactValues[2]?.trim() || null,
                      phone: contactValues[3]?.trim() || null,
                      status: 'ACTIVE',
                      source: 'IMPORT'
                    }
                  })
                  contactIds.push(newContact.id)
                }
              }
            }
          }

          // Add contacts to the default list
          if (contactIds.length > 0) {
            await prisma.contactListMember.createMany({
              data: contactIds.map(contactId => ({
                contactListId: defaultList.id,
                contactId
              }))
            })
          }
        }
      }
    }

    return NextResponse.json({
      message: "Import completed",
      results: [
        {
          success: true,
          message: `Successfully processed ${lines.length} rows`,
          details: `Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Duplicates: ${duplicateCount}`
        }
      ]
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    )
  }
}

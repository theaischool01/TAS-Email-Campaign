import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
// @ts-ignore
import Papa from "papaparse"

const prisma = prismaClient as any

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const targetListId = formData.get("targetListId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!targetListId) {
      return NextResponse.json({ error: "No list selected" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 })
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 25MB" }, { status: 400 })
    }

    const targetList = await prisma.contactList.findFirst({
      where: {
        id: targetListId,
        ownerId: session.user.id,
      },
    })

    if (!targetList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 })
    }

    const csvText = await file.text()

    // Parse with PapaParse — handles quoted fields, commas inside values, etc.
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase(),
    })

    const rows = parsed.data as Record<string, string>[]
    const fields = (parsed.meta?.fields ?? []) as string[]

    // Determine column mapping from headers
    const emailCol = fields.includes("email") ? "email" : null
    const nameCol = fields.includes("name") ? "name" : null
    const firstNameCol =
      fields.includes("firstname") ? "firstname"
      : fields.includes("first name") ? "first name"
      : null
    const lastNameCol =
      fields.includes("lastname") ? "lastname"
      : fields.includes("last name") ? "last name"
      : null

    const counts = {
      total: rows.length,
      added: 0,
      duplicates: 0,
      ignored: 0,
    }

    const contactIds: string[] = []

    for (const row of rows) {
      // --- Email ---
      const rawEmail = emailCol ? (row[emailCol] ?? "").trim().toLowerCase() : ""

      if (!rawEmail || !emailRegex.test(rawEmail)) {
        counts.ignored++
        continue
      }

      // --- Duplicate check ---
      const existing = await prisma.contact.findUnique({
        where: { email: rawEmail },
      })

      if (existing) {
        counts.duplicates++
        // Still add to list if not already a member
        const alreadyMember = await prisma.contactListMember.findFirst({
          where: { contactListId: targetListId, contactId: existing.id },
        })
        if (!alreadyMember) {
          contactIds.push(existing.id)
        }
        continue
      }

      // --- Name parsing ---
      let firstName: string | null = null
      let lastName: string | null = null

      if (nameCol && row[nameCol]) {
        const parts = row[nameCol].trim().split(/\s+/)
        firstName = parts[0] || null
        lastName = parts.slice(1).join(" ") || null
      } else {
        if (firstNameCol && row[firstNameCol]) {
          firstName = row[firstNameCol].trim() || null
        }
        if (lastNameCol && row[lastNameCol]) {
          lastName = row[lastNameCol].trim() || null
        }
      }

      // --- Create contact ---
      try {
        const newContact = await prisma.contact.create({
          data: {
            email: rawEmail,
            firstName,
            lastName,
            status: "ACTIVE",
            source: "IMPORT",
          },
        })

        contactIds.push(newContact.id)
        counts.added++
      } catch {
        // Unique constraint race condition — treat as duplicate
        counts.duplicates++
      }
    }

    // Bulk-add all new contacts to the target list
    if (contactIds.length > 0) {
      await prisma.contactListMember.createMany({
        data: contactIds.map((contactId) => ({
          contactListId: targetListId,
          contactId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      success: true,
      results: counts,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    )
  }
}

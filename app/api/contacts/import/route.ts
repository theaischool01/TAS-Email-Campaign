import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { enforceRateLimit, getClientIp, handleRateLimitError } from "@/lib/security/rate-limit"
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

    // Enforce dual rate limiting: User quota & IP quota
    const ip = getClientIp(request)
    try {
      await enforceRateLimit("csvImportUser", `import:user:${session.user.id}`)
      await enforceRateLimit("csvImportIp", `import:ip:${ip}`)
    } catch (limitErr) {
      const errorRes = handleRateLimitError(limitErr)
      if (errorRes) return errorRes
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
      failed: 0,
      ignored: 0,
    }

    const BATCH_SIZE = 1000;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const validRows: Array<{
        email: string;
        firstName: string | null;
        lastName: string | null;
      }> = [];

      // Phase 1: Filter & Normalize batch rows
      for (const row of chunk) {
        const rawEmail = emailCol ? (row[emailCol] ?? "").trim().toLowerCase() : "";
        if (!rawEmail || !emailRegex.test(rawEmail)) {
          counts.ignored++;
          continue;
        }

        let firstName: string | null = null;
        let lastName: string | null = null;

        if (nameCol && row[nameCol]) {
          const parts = row[nameCol].trim().split(/\s+/);
          firstName = parts[0] || null;
          lastName = parts.slice(1).join(" ") || null;
        } else {
          if (firstNameCol && row[firstNameCol]) {
            firstName = row[firstNameCol].trim() || null;
          }
          if (lastNameCol && row[lastNameCol]) {
            lastName = row[lastNameCol].trim() || null;
          }
        }

        validRows.push({
          email: rawEmail,
          firstName,
          lastName,
        });
      }

      if (validRows.length === 0) continue;

      try {
        const emails = validRows.map(r => r.email);

        // Fetch existing contacts in DB for this batch
        const existingContacts = await prisma.contact.findMany({
          where: {
            userId: session.user.id,
            email: { in: emails }
          },
          select: {
            id: true,
            email: true
          }
        });

        const existingMap = new Map<string, { id: string; email: string }>(
          existingContacts.map((c: any) => [c.email.toLowerCase(), c])
        );

        // Separate new contacts vs existing duplicates
        const newContactsData: any[] = [];
        const existingIdsToLink: string[] = [];

        for (const row of validRows) {
          const matched = existingMap.get(row.email);
          if (matched) {
            counts.duplicates++;
            existingIdsToLink.push(matched.id);
          } else {
            newContactsData.push({
              email: row.email,
              userId: session.user.id,
              firstName: row.firstName,
              lastName: row.lastName,
              status: "ACTIVE",
              source: "IMPORT"
            });
          }
        }

        // Run transaction for this batch
        await prisma.$transaction(async (tx: any) => {
          // 1. Create missing contacts
          if (newContactsData.length > 0) {
            await tx.contact.createMany({
              data: newContactsData,
              skipDuplicates: true
            });
          }

          // 2. Fetch all contacts IDs for the chunk
          const contacts = await tx.contact.findMany({
            where: {
              userId: session.user.id,
              email: { in: emails }
            },
            select: {
              id: true,
              email: true
            }
          });

          // 3. Build membership arrays
          const memberships = contacts.map((c: any) => ({
            contactListId: targetListId,
            contactId: c.id
          }));

          // 4. Bulk insert memberships
          if (memberships.length > 0) {
            await tx.contactListMember.createMany({
              data: memberships,
              skipDuplicates: true
            });
          }

          counts.added += newContactsData.length;
        });

        // Clear references to let garbage collection free heap
        existingMap.clear();
        newContactsData.length = 0;
        existingIdsToLink.length = 0;
        emails.length = 0;

      } catch (batchErr) {
        console.error(`❌ Import failed for batch index ${i}:`, batchErr);
        counts.failed += chunk.length;
      }
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

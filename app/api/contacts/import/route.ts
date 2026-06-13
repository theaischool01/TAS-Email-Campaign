import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { enforceRateLimit, getClientIp, handleRateLimitError } from "@/lib/security/rate-limit"
import { prisma as prismaClient } from "@/app/lib/prisma"
// @ts-ignore
import Papa from "papaparse"
import { validateEmail } from "@/lib/email-validator"

const prisma = prismaClient as any

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
    const tagsCol = fields.includes("tags") ? "tags" : null
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
      newContactsCreated: 0,
      existingContactsAddedToList: 0,
      alreadyInList: 0,
      ignored: 0,
      failed: 0,
    }

    const BATCH_SIZE = 500; // Reduced batch size for concurrent DNS validation

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const validRows: Array<{
        email: string;
        firstName: string | null;
        lastName: string | null;
        tags: string | null;
      }> = [];

      // Phase 1: Filter & Validate batch rows in parallel chunks
      const validationPromises = chunk.map(async (row) => {
        const rawEmail = emailCol ? (row[emailCol] ?? "").trim() : "";
        if (!rawEmail) return null;

        // Perform 3-layer email validation
        const valResult = await validateEmail(rawEmail);
        if (!valResult.isValid) return null;

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

        const rawTags = tagsCol ? (row[tagsCol] ?? "").trim() : "";
        const sanitizedTags = rawTags
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)
          .join(",");

        return {
          email: rawEmail.toLowerCase(),
          firstName,
          lastName,
          tags: sanitizedTags || null,
        };
      });

      const resolvedBatch = await Promise.all(validationPromises);
      for (const item of resolvedBatch) {
        if (item) {
          validRows.push(item);
        } else {
          counts.ignored++;
        }
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
            email: true,
            tags: true
          }
        });

        const existingMap = new Map<string, { id: string; email: string; tags: string | null }>(
          existingContacts.map((c: any) => [c.email.toLowerCase(), c])
        );

        // Fetch existing memberships for targetListId
        const existingMemberships = await prisma.contactListMember.findMany({
          where: {
            contactListId: targetListId,
            contactId: { in: existingContacts.map((c: any) => c.id) }
          },
          select: {
            contactId: true
          }
        });

        const existingMembershipsSet = new Set<string>(
          existingMemberships.map((m: any) => m.contactId)
        );

        // Separate new contacts vs existing duplicates
        const newContactsData: any[] = [];
        const existingToLink: { contactId: string; email: string; newTags: string | null; currentTags: string | null }[] = [];
        const existingAlreadyInList: { contactId: string; email: string; newTags: string | null; currentTags: string | null }[] = [];

        for (const row of validRows) {
          const matched = existingMap.get(row.email);
          if (matched) {
            const hasMembership = existingMembershipsSet.has(matched.id);
            if (hasMembership) {
              existingAlreadyInList.push({
                contactId: matched.id,
                email: matched.email,
                newTags: row.tags,
                currentTags: matched.tags
              });
            } else {
              existingToLink.push({
                contactId: matched.id,
                email: matched.email,
                newTags: row.tags,
                currentTags: matched.tags
              });
            }
          } else {
            newContactsData.push({
              email: row.email,
              userId: session.user.id,
              firstName: row.firstName,
              lastName: row.lastName,
              tags: row.tags,
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

          // 2. Fetch newly created contacts to get their IDs
          const newEmails = newContactsData.map(c => c.email);
          const newCreatedContacts = await tx.contact.findMany({
            where: {
              userId: session.user.id,
              email: { in: newEmails }
            },
            select: {
              id: true,
              email: true
            }
          });

          // 3. Build memberships arrays for newly created contacts + existing to link
          const newMemberships = newCreatedContacts.map((c: any) => ({
            contactListId: targetListId,
            contactId: c.id
          }));

          const existingMembershipsToCreate = existingToLink.map(e => ({
            contactListId: targetListId,
            contactId: e.contactId
          }));

          const allMembershipsToCreate = [...newMemberships, ...existingMembershipsToCreate];

          // 4. Bulk insert memberships
          if (allMembershipsToCreate.length > 0) {
            await tx.contactListMember.createMany({
              data: allMembershipsToCreate,
              skipDuplicates: true
            });
            await tx.contactToContactList.createMany({
              data: allMembershipsToCreate.map((m: any) => ({
                A: m.contactId,
                B: m.contactListId
              })),
              skipDuplicates: true
            });
          }

          // Helper helper to merge tags case-insensitively while preserving the casing of the first occurrence
          const mergeTags = (existingStr: string | null, incomingStr: string | null): string | null => {
            const existingArr = existingStr ? existingStr.split(",").map(t => t.trim()).filter(Boolean) : [];
            const incomingArr = incomingStr ? incomingStr.split(",").map(t => t.trim()).filter(Boolean) : [];
            
            const seen = new Set<string>();
            const result: string[] = [];

            // Add all existing tags first
            for (const tag of existingArr) {
              const lower = tag.toLowerCase();
              if (!seen.has(lower)) {
                seen.add(lower);
                result.push(tag);
              }
            }

            // Add incoming tags
            for (const tag of incomingArr) {
              const lower = tag.toLowerCase();
              if (!seen.has(lower)) {
                seen.add(lower);
                result.push(tag);
              }
            }

            return result.join(",") || null;
          };

          // 5. Update merged tags for existing contacts
          const allExistingContactsToUpdate = [...existingToLink, ...existingAlreadyInList];
          for (const item of allExistingContactsToUpdate) {
            const merged = mergeTags(item.currentTags, item.newTags);
            if (merged !== item.currentTags) {
              await tx.contact.update({
                where: { id: item.contactId },
                data: { tags: merged }
              });
            }
          }

          counts.newContactsCreated += newContactsData.length;
          counts.existingContactsAddedToList += existingToLink.length;
          counts.alreadyInList += existingAlreadyInList.length;
        });

        // Clear references to let garbage collection free heap
        existingMap.clear();
        newContactsData.length = 0;
        existingToLink.length = 0;
        existingAlreadyInList.length = 0;
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


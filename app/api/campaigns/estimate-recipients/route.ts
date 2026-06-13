import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { z } from "zod"

const prisma = prismaClient as any

const estimateSchema = z.object({
  listIds: z.array(z.string()),
  includedTags: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = estimateSchema.parse(body)
    const { listIds, includedTags = [] } = validatedData

    if (listIds.length === 0) {
      return NextResponse.json({
        totalContacts: 0,
        excludedContacts: 0,
        finalRecipients: 0
      })
    }

    // 1. Get total active contacts count across all selected lists (excluding suppressed emails)
    const totalResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT c.id)::integer AS count
      FROM contacts c
      JOIN "_ContactToContactList" m ON m."A" = c.id
      WHERE m."B" = ANY($1::text[])
        AND c.status = 'ACTIVE'
        AND c.email NOT IN (SELECT email FROM suppression_list WHERE "userId" = $2)
    `, listIds, session.user.id)
    const totalContacts = totalResult[0]?.count || 0

    let finalRecipients = totalContacts

    // 2. Get final recipients count with tag-inclusion active (using Postgres overlap operator)
    if (includedTags.length > 0) {
      // Normalize included tags to lowercase for comparison
      const normalizedIncluded = includedTags.map(t => t.trim().toLowerCase())

      const finalResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(DISTINCT c.id)::integer AS count
        FROM contacts c
        JOIN "_ContactToContactList" m ON m."A" = c.id
        WHERE m."B" = ANY($1::text[])
          AND c.status = 'ACTIVE'
          AND c.email NOT IN (SELECT email FROM suppression_list WHERE "userId" = $2)
          AND (c.tags IS NOT NULL AND c.tags != '' AND (
            ARRAY(SELECT TRIM(LOWER(val)) FROM unnest(string_to_array(c.tags, ',')) val) && $3::text[]
          ))
      `, listIds, session.user.id, normalizedIncluded)
      finalRecipients = finalResult[0]?.count || 0
    }

    const excludedContacts = totalContacts - finalRecipients

    return NextResponse.json({
      totalContacts,
      excludedContacts,
      finalRecipients
    })
  } catch (error: any) {
    console.error("Error estimating recipients:", error)
    return NextResponse.json(
      { error: "Failed to estimate recipients", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

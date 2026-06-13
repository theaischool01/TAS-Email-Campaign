import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { canAccessResource } from "@/lib/rbac-filters"

const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contactList = await prisma.contactList.findUnique({
      where: { id: id }
    })

    if (!contactList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 })
    }

    if (!canAccessResource(session, contactList.ownerId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Database-level SQL aggregation of unique normalized tags with active counts
    const rawTags: { tag: string; count: number }[] = await prisma.$queryRawUnsafe(`
      SELECT LOWER(TRIM(unnest(string_to_array(c.tags, ',')))) AS tag, COUNT(*)::integer AS count
      FROM contacts c
      JOIN "_ContactToContactList" m ON m."A" = c.id
      WHERE m."B" = $1 AND c.status = 'ACTIVE' AND c.tags IS NOT NULL AND c.tags != ''
      GROUP BY tag
      ORDER BY count DESC
    `, id)

    // Capitalize tag output for display in UI, e.g. "student" -> "Student"
    const tags = rawTags.map(item => ({
      tag: item.tag.charAt(0).toUpperCase() + item.tag.slice(1),
      count: item.count
    }))

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching list tags:", error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}

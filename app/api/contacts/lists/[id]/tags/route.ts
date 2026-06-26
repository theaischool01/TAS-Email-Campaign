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

    // Database-level SQL aggregation of unique relational tags with active counts
    const rawTags: { id: string; name: string; count: number }[] = await prisma.$queryRawUnsafe(`
      SELECT t.id AS id, t.name AS name, COUNT(*)::integer AS count
      FROM contact_tags ct
      JOIN tags t ON t.id = ct."tagId"
      JOIN contacts c ON c.id = ct."contactId"
      JOIN contact_list_members m ON m."contactId" = c.id
      WHERE m."contactListId" = $1 AND c.status = 'ACTIVE'
      GROUP BY t.id, t.name
      ORDER BY count DESC
    `, id)

    const tags = rawTags.map(item => ({
      id: item.id,
      name: item.name,
      tag: item.name, // for backward compatibility
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

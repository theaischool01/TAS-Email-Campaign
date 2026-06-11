import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { ContactAccessControl } from "@/lib/rbac/contact-access"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get("page") || "1", 10)
    const limitParam = parseInt(searchParams.get("limit") || "50", 10)

    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam)
    const rawLimit = Math.max(1, isNaN(limitParam) ? 50 : limitParam)
    const limit = Math.min(200, rawLimit)

    const skip = (page - 1) * limit
    const take = limit

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where: { userId: session.user.id },
        include: {
          lists: {
            include: {
              contactList: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take
      }),
      prisma.contact.count({
        where: { userId: session.user.id }
      })
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}

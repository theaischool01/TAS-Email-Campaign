import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { createOwnerFilter } from "@/lib/rbac-filters"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""

    // Get contact lists with contact count using role-based filtering
    const ownerFilter = createOwnerFilter(session)
    const contactLists = await prisma.contactList.findMany({
      where: {
        ...ownerFilter,
        ...(search && {
          name: {
            contains: search,
            mode: "insensitive"
          }
        })
      },
      include: {
        _count: {
          select: {
            members: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(contactLists)
  } catch (error) {
    console.error("Error fetching contact lists:", error)
    return NextResponse.json(
      { error: "Failed to fetch contact lists" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Full Session Object:", JSON.stringify(session, null, 2))
    console.log("Session User Object:", JSON.stringify(session.user, null, 2))
    console.log("Session User ID:", session.user.id)
    console.log("Session User Email:", session.user.email)
    console.log("Session User Role:", session.user.role)

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 })
    }

    console.log("Creating contact list with data:", {
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: session.user.id
    })

    const contactList = await prisma.contactList.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: session.user.id
      }
    })

    console.log("Contact list created successfully:", contactList)
    return NextResponse.json(contactList, { status: 201 })
  } catch (error) {
    console.error("Error creating contact list:", {
      error: error,
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      { error: "Failed to create contact list", details: error.message },
      { status: 500 }
    )
  }
}

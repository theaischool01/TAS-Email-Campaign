import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { ContactService } from "@/lib/services/contact.service"

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 CONTACT LISTS API: Request received")
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log("🔧 CONTACT LISTS API: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔧 CONTACT LISTS API: Session found:", {
      userId: session.user.id,
      userRole: session.user.role,
      userEmail: session.user.email
    })

    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""

    // Use centralized service for consistent RBAC across platform
    const contactLists = await ContactService.getContactLists(session, prisma, { search })

    console.log(" CONTACT LISTS API: Query results:", {
      count: contactLists.length,
      firstResult: contactLists[0] ? {
        id: contactLists[0].id,
        name: contactLists[0].name,
        ownerId: contactLists[0].ownerId,
        memberCount: contactLists[0]._count?.members
      } : null
    })

    return NextResponse.json({
      success: true,
      contactLists: contactLists
    })
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
      message: (error as any).message,
      code: (error as any).code,
      meta: (error as any).meta
    })
    return NextResponse.json(
      { error: "Failed to create contact list", details: (error as any).message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { canAccessResource, createContactFilter } from "@/lib/rbac-filters"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await params before usage
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get contact with list memberships
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            contactList: true
          }
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // Check if user can access this contact (SUPER_ADMIN can access all, others only if in their lists)
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    if (!isSuperAdmin) {
      // For non-admin users, check if contact is in their contact lists
      const contactListIds = contact.lists?.map((list: any) => list.contactList?.id) || []
      const userLists = await prisma.contactList.findMany({
        where: {
          id: { in: contactListIds },
          ownerId: session.user.id
        },
        select: { id: true }
      })

      const hasAccess = userLists.length > 0
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await params before usage
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get contact with list memberships to verify access
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            contactList: {
            select: { ownerId: true }
          }
        }
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // Check if user can access this contact (SUPER_ADMIN can access all, others only if in their lists)
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    if (!isSuperAdmin) {
      // For non-admin users, check if contact is in their contact lists
      const hasAccess = contact.lists?.some((list: any) => 
        list.contactList?.ownerId === session.user.id
      )

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Delete contact (cascade will handle list memberships)
    await prisma.contact.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Contact deleted successfully" })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    )
  }
}

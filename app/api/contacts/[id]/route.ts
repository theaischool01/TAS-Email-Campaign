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

    // Check if user owns this contact
    if (contact.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
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

    // Get contact to verify access
    const contact = await prisma.contact.findUnique({
      where: { id }
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    // Check ownership
    if (contact.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
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

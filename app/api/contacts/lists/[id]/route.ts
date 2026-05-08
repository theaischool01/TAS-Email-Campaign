import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { createOwnerFilter, canAccessResource } from "@/lib/rbac-filters"

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

    // Find the contact list first (without ownership filter)
    const contactList = await prisma.contactList.findUnique({
      where: {
        id: id
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
      }
    })

    if (!contactList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 })
    }

    // Check if user can access this contact list
    if (!canAccessResource(session, contactList.ownerId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(contactList)
  } catch (error) {
    console.error("Error fetching contact list:", error)
    return NextResponse.json(
      { error: "Failed to fetch contact list" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the contact list first
    const contactList = await prisma.contactList.findUnique({
      where: {
        id: id
      }
    })

    if (!contactList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 })
    }

    // Check if user can access this contact list
    if (!canAccessResource(session, contactList.ownerId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the contact list (cascade will delete members)
    await prisma.contactList.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ message: "Contact list deleted successfully" })
  } catch (error) {
    console.error("Error deleting contact list:", error)
    return NextResponse.json(
      { error: "Failed to delete contact list" },
      { status: 500 }
    )
  }
}

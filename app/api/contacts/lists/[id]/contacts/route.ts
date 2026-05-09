import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { canAccessResource, createContactListMemberFilter } from "@/lib/rbac-filters"

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

    // Get contacts in this list
    const contacts = await prisma.contact.findMany({
      where: {
        lists: {
          some: {
            contactListId: id
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await params before usage
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

    const formData = await request.formData()
    const email = formData.get("email") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const phone = formData.get("phone") as string
    const company = formData.get("company") as string
    const city = formData.get("city") as string

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check for duplicate email
    const existingContact = await prisma.contact.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (existingContact) {
      return NextResponse.json({ error: "Contact with this email already exists" }, { status: 409 })
    }

    // Create new contact
    const newContact = await prisma.contact.create({
      data: {
        email: email.trim().toLowerCase(),
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        city: city?.trim() || null,
        status: "ACTIVE",
        source: "MANUAL"
      }
    })

    // Add contact to the list
    await prisma.contactListMember.create({
      data: {
        contactListId: id,
        contactId: newContact.id
      }
    })

    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error("CONTACT CREATE ERROR:", {
      error: error,
      message: (error as any).message,
      code: (error as any).code,
      meta: (error as any).meta,
      stack: (error as any).stack
    })
    return NextResponse.json(
      { error: "Failed to add contact", details: (error as any).message },
      { status: 500 }
    )
  }
}

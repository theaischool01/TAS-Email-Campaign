import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { canAccessResource, createContactListMemberFilter } from "@/lib/rbac-filters"
import { validateEmail } from "@/lib/email-validator"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

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
        userId: session.user.id,
        lists: {
          some: {
            contactListId: id
          }
        }
      },
      include: {
        contactTags: {
          include: {
            tag: true
          }
        },
        customFieldValues: {
          include: {
            customField: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const mappedContacts = contacts.map((contact: any) => {
      const relationTagsStr = contact.contactTags.map((ct: any) => ct.tag.name).join(",")
      const { CustomValueService } = require("@/lib/custom-fields/value-service")
      const customFields = CustomValueService.flattenCustomFieldValues(contact.customFieldValues)
      const { contactTags, customFieldValues, ...cleanContact } = contact
      return {
        ...cleanContact,
        tags: relationTagsStr,
        customFields
      }
    })

    return NextResponse.json(mappedContacts)
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
    const rawTags = (formData.get("tags") as string) || ""
    const customFieldsJson = formData.get("customFields") as string
    const customFieldsData = customFieldsJson ? JSON.parse(customFieldsJson) : {}

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const newCustomFieldsJson = formData.get("newCustomFields") as string
    const newCustomFieldsData = newCustomFieldsJson ? JSON.parse(newCustomFieldsJson) : []

    // 3-layer Email Validation
    const validation = await validateEmail(email)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const sanitizedEmail = email.trim().toLowerCase()

    // Check for duplicate email
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_email: {
          userId: session.user.id,
          email: sanitizedEmail
        }
      }
    })

    if (existingContact) {
      return NextResponse.json({ error: "Contact with this email already exists" }, { status: 409 })
    }

    // Sanitize tags: comma separated, trimmed
    const sanitizedTags = rawTags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .join(",")

    let newContact;
    try {
      newContact = await prisma.$transaction(async (tx: any) => {
        const clientCustomFields = { ...customFieldsData }

        if (newCustomFieldsData && newCustomFieldsData.length > 0) {
          const { generateCustomFieldKey } = require("@/lib/custom-fields/key-generator")
          for (const newField of newCustomFieldsData) {
            const displayName = newField.displayName.trim()
            const key = generateCustomFieldKey(displayName)

            // Check duplicate key or case-insensitive display name
            let existingField = await tx.contactCustomField.findFirst({
              where: {
                userId: session.user.id,
                OR: [
                  { key },
                  { displayName: { equals: displayName, mode: "insensitive" } }
                ]
              }
            })

            if (!existingField) {
              existingField = await tx.contactCustomField.create({
                data: {
                  userId: session.user.id,
                  key,
                  displayName,
                  type: newField.type
                }
              })
            }

            clientCustomFields[existingField.key] = newField.value
          }
        }

        // Validate custom fields inside transaction
        let operations: any[] = []
        if (Object.keys(clientCustomFields).length > 0) {
          const { CustomValueService } = require("@/lib/custom-fields/value-service")
          operations = await CustomValueService.validateCustomFieldValues(
            session.user.id,
            clientCustomFields,
            tx
          )
        }

        const contact = await tx.contact.create({
          data: {
            email: sanitizedEmail,
            userId: session.user.id,
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
        await tx.contactListMember.create({
          data: {
            contactListId: id,
            contactId: contact.id
          }
        })
        await tx.contactToContactList.create({
          data: {
            A: contact.id,
            B: id
          }
        })

        // Tag assignments
        if (rawTags.trim()) {
          const tagList = rawTags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean)
          const uniqueTags = Array.from(new Set(tagList))

          for (const name of uniqueTags) {
            const slug = slugify(name)
            if (!slug) continue

            let tag = await tx.tag.findUnique({
              where: {
                userId_slug: {
                  userId: session.user.id,
                  slug
                }
              }
            })
            if (!tag) {
              tag = await tx.tag.create({
                data: {
                  name,
                  slug,
                  userId: session.user.id,
                  color: "#3B82F6"
                }
              })
            }
            await tx.contactTag.create({
              data: {
                contactId: contact.id,
                tagId: tag.id
              }
            })
          }
        }

        // Perform custom fields operations
        for (const op of operations) {
          if (op.action === "UPSERT") {
            await tx.contactFieldValue.upsert({
              where: {
                contactId_fieldId: {
                  contactId: contact.id,
                  fieldId: op.fieldId
                }
              },
              update: op.values,
              create: {
                contactId: contact.id,
                fieldId: op.fieldId,
                ...op.values
              }
            })
          }
        }

        return contact
      })
    } catch (txError: any) {
      return NextResponse.json({ error: txError.message || "Failed to save contact" }, { status: 400 })
    }

    // Fetch the updated values to return a fresh flat customFields structure
    const [freshValues, freshContactTags] = await Promise.all([
      prisma.contactFieldValue.findMany({
        where: { contactId: newContact.id },
        include: { customField: true }
      }),
      prisma.contactTag.findMany({
        where: { contactId: newContact.id },
        include: { tag: true }
      })
    ])

    const { CustomValueService } = require("@/lib/custom-fields/value-service")
    const customFields = CustomValueService.flattenCustomFieldValues(freshValues)
    const relationTagsStr = freshContactTags.map((ct: any) => ct.tag.name).join(",")

    return NextResponse.json({
      ...newContact,
      tags: relationTagsStr,
      customFields
    }, { status: 201 })
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

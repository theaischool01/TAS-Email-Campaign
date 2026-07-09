import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { canAccessResource } from "@/lib/rbac-filters"
import { z } from "zod"

const prisma = prismaClient as any

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function getEmailEditPermission(contactId: string) {
  // Check if contact has any email deliveries or campaign activity logs
  const [deliveriesCount, logsCount] = await Promise.all([
    prisma.emailDelivery.count({ where: { contactId } }),
    prisma.campaignActivityLog.count({ where: { contactId } })
  ])

  const hasHistory = deliveriesCount > 0 || logsCount > 0

  return {
    canEditEmail: !hasHistory,
    reason: hasHistory
      ? "This email address cannot be changed because it has existing campaign history. Create a new contact if you need to use a different email address."
      : ""
  }
}

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

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            contactList: true
          }
        },
        customFieldValues: {
          include: {
            customField: true
          }
        },
        contactTags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    if (contact.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { CustomValueService } = require("@/lib/custom-fields/value-service")
    const customFields = CustomValueService.flattenCustomFieldValues(contact.customFieldValues)

    const relationTagsStr = contact.contactTags.map((ct: any) => ct.tag.name).join(",")

    const { customFieldValues, contactTags, ...cleanContact } = contact
    cleanContact.tags = relationTagsStr

    const permissions = await getEmailEditPermission(id)

    return NextResponse.json({
      contact: {
        ...cleanContact,
        customFields
      },
      permissions
    })
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    )
  }
}

const patchContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  city: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"]).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  newCustomFields: z.array(z.object({
    displayName: z.string(),
    type: z.enum(["TEXT", "NUMBER", "DATE", "BOOLEAN", "DROPDOWN"]),
    value: z.any()
  })).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id }
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    if (contact.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = patchContactSchema.parse(body)

    // 1. Email Modification Lock Checks
    if (validatedData.email && validatedData.email.trim().toLowerCase() !== contact.email.toLowerCase()) {
      const emailPermissions = await getEmailEditPermission(id)
      if (!emailPermissions.canEditEmail) {
        return NextResponse.json(
          { error: emailPermissions.reason },
          { status: 403 }
        )
      }

      // Check duplicate emails for the same user
      const existingEmailContact = await prisma.contact.findFirst({
        where: {
          userId: session.user.id,
          email: { equals: validatedData.email.trim(), mode: "insensitive" },
          id: { not: id }
        }
      })

      if (existingEmailContact) {
        return NextResponse.json(
          { error: "A contact with this email address already exists in your workspace." },
          { status: 400 }
        )
      }
    }

    // 2. Contact Status Transition Rules
    if (validatedData.status && validatedData.status !== contact.status) {
      // Current system states lock checks
      const isSystemState = contact.status === "BOUNCED" || contact.status === "COMPLAINED"
      if (isSystemState) {
        return NextResponse.json(
          { error: `Cannot manually change status from system-managed state: ${contact.status}` },
          { status: 400 }
        )
      }
      
      // User is only allowed to toggle/use ACTIVE or UNSUBSCRIBED manually
      if (validatedData.status === "BOUNCED" || validatedData.status === "COMPLAINED") {
        return NextResponse.json(
          { error: `Cannot manually set status to system-managed state: ${validatedData.status}` },
          { status: 400 }
        )
      }
    }

    // 3. Tag Normalization
    let normalizedTags = contact.tags
    if (validatedData.tags !== undefined) {
      const tagList = validatedData.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)

      const uniqueTags: string[] = []
      const seenLower = new Set<string>()

      for (const t of tagList) {
        const tLower = t.toLowerCase()
        if (!seenLower.has(tLower)) {
          seenLower.add(tLower)
          uniqueTags.push(t)
        }
      }
      normalizedTags = uniqueTags.join(",")
    }

    const updatedContact = await prisma.$transaction(async (tx: any) => {
      const clientCustomFields = validatedData.customFields !== undefined ? { ...validatedData.customFields } : null

      if (validatedData.newCustomFields && validatedData.newCustomFields.length > 0) {
        const { generateCustomFieldKey } = require("@/lib/custom-fields/key-generator")
        const resolvedCustomFields = clientCustomFields || {}
        
        for (const newField of validatedData.newCustomFields) {
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

          resolvedCustomFields[existingField.key] = newField.value
        }
      }

      // Validate custom fields inside the transaction
      let operations: any[] = []
      const fieldsToValidate = clientCustomFields || (validatedData.newCustomFields && validatedData.newCustomFields.length > 0 ? {} : null)
      if (fieldsToValidate) {
        const { CustomValueService } = require("@/lib/custom-fields/value-service")
        operations = await CustomValueService.validateCustomFieldValues(
          session.user.id,
          fieldsToValidate,
          tx
        )
      }
      // Update legacy contact fields
      const contactUpdate = await tx.contact.update({
        where: { id },
        data: {
          firstName: validatedData.firstName !== undefined ? validatedData.firstName : contact.firstName,
          lastName: validatedData.lastName !== undefined ? validatedData.lastName : contact.lastName,
          email: validatedData.email !== undefined ? validatedData.email.trim() : contact.email,
          phone: validatedData.phone !== undefined ? validatedData.phone : contact.phone,
          company: validatedData.company !== undefined ? validatedData.company : contact.company,
          city: validatedData.city !== undefined ? validatedData.city : contact.city,
          status: validatedData.status !== undefined ? validatedData.status : contact.status,
          updatedAt: new Date()
        }
      })

      // Perform custom fields operations
      for (const op of operations) {
        if (op.action === "UPSERT") {
          await tx.contactFieldValue.upsert({
            where: {
              contactId_fieldId: {
                contactId: id,
                fieldId: op.fieldId
              }
            },
            update: op.values,
            create: {
              contactId: id,
              fieldId: op.fieldId,
              ...op.values
            }
          })
        } else if (op.action === "DELETE") {
          const exists = await tx.contactFieldValue.findUnique({
            where: {
              contactId_fieldId: {
                contactId: id,
                fieldId: op.fieldId
              }
            }
          })
          if (exists) {
            await tx.contactFieldValue.delete({
              where: {
                contactId_fieldId: {
                  contactId: id,
                  fieldId: op.fieldId
                }
              }
            })
          }
        }
      }

      // Delta updates for tags
      if (validatedData.tags !== undefined) {
        const tagList = validatedData.tags
          .split(",")
          .map(t => t.trim())
          .filter(Boolean)

        const uniqueTags = Array.from(new Set(tagList))
        const tagSlugs = uniqueTags.map(t => slugify(t)).filter(Boolean)

        // Find existing contact tags
        const existingLinks = await tx.contactTag.findMany({
          where: { contactId: id },
          include: { tag: true }
        })

        const existingSlugs = existingLinks.map((l: any) => l.tag.slug)

        // Remove deleted tags
        const linksToRemove = existingLinks.filter((l: any) => !tagSlugs.includes(l.tag.slug))
        if (linksToRemove.length > 0) {
          await tx.contactTag.deleteMany({
            where: {
              id: { in: linksToRemove.map((l: any) => l.id) }
            }
          })
        }

        // Add missing tags
        for (const name of uniqueTags) {
          const slug = slugify(name)
          if (!slug) continue
          if (!existingSlugs.includes(slug)) {
            // Find or create the tag first
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
            // Create contact-tag association
            await tx.contactTag.create({
              data: {
                contactId: id,
                tagId: tag.id
              }
            })
          }
        }
      }

      return contactUpdate
    })

    // Fetch the updated values to return a fresh flat customFields structure
    const [freshValues, freshContactTags] = await Promise.all([
      prisma.contactFieldValue.findMany({
        where: { contactId: id },
        include: { customField: true }
      }),
      prisma.contactTag.findMany({
        where: { contactId: id },
        include: { tag: true }
      })
    ])

    const { CustomValueService } = require("@/lib/custom-fields/value-service")
    const customFields = CustomValueService.flattenCustomFieldValues(freshValues)
    const relationTagsStr = freshContactTags.map((ct: any) => ct.tag.name).join(",")

    return NextResponse.json({
      success: true,
      contact: {
        ...updatedContact,
        tags: relationTagsStr,
        customFields
      }
    })
  } catch (error: any) {
    console.error("Error updating contact:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.format() },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to update contact" },
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

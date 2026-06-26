import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { ContactAccessControl } from "@/lib/rbac/contact-access"

const prisma = prismaClient as any

type SortBy = "createdAt" | "updatedAt" | "name" | "email" | "company" | "status"
type SortDir = "asc" | "desc"

const SORTABLE_FIELDS = new Set<SortBy>(["createdAt", "updatedAt", "name", "email", "company", "status"])
const SORT_DIRECTIONS = new Set<SortDir>(["asc", "desc"])

function parsePositiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = parseInt(value || String(fallback), 10)
  const safe = Math.max(1, isNaN(parsed) ? fallback : parsed)
  return max ? Math.min(max, safe) : safe
}

function parseCustomFilters(raw: string | null) {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    const rules = Array.isArray(parsed?.rules) ? parsed.rules : Array.isArray(parsed) ? parsed : []
    return rules.filter((rule: any) => rule && rule.type === "RULE" && typeof rule.field === "string")
  } catch {
    return []
  }
}

function customFilterToWhere(rule: any) {
  const key = String(rule.field).startsWith("custom.") ? String(rule.field).split(".")[1] : String(rule.field)
  const value = rule.value
  const operator = rule.operator || "equals"

  if (!key || value === undefined || value === null || value === "") return null

  const stringValue = String(value)
  const numberValue = Number(value)
  const dateValue = Date.parse(stringValue)
  const booleanValue = stringValue.toLowerCase() === "true" || stringValue === "Yes" || value === true

  const valueConditions: any[] = []

  if (operator === "contains") {
    valueConditions.push({ textValue: { contains: stringValue, mode: "insensitive" } })
  } else if (operator === "greater_than" && !Number.isNaN(numberValue)) {
    valueConditions.push({ numberValue: { gt: numberValue } })
  } else if (operator === "less_than" && !Number.isNaN(numberValue)) {
    valueConditions.push({ numberValue: { lt: numberValue } })
  } else {
    valueConditions.push({ textValue: { equals: stringValue, mode: "insensitive" } })
    if (!Number.isNaN(numberValue)) valueConditions.push({ numberValue })
    if (!Number.isNaN(dateValue)) valueConditions.push({ dateValue: new Date(dateValue) })
    valueConditions.push({ booleanValue })
  }

  return {
    customFieldValues: {
      some: {
        customField: { key },
        OR: valueConditions
      }
    }
  }
}

function buildOrderBy(sortBy: SortBy, sortDir: SortDir) {
  if (sortBy === "name") {
    return [{ firstName: sortDir }, { lastName: sortDir }, { email: sortDir }]
  }

  return [{ [sortBy]: sortDir }]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const limit = parsePositiveInt(searchParams.get("limit"), 50, 200)
    const search = (searchParams.get("search") || "").trim()
    const tag = (searchParams.get("tag") || "").trim()
    const sortByParam = searchParams.get("sortBy") as SortBy | null
    const sortDirParam = searchParams.get("sortDir") as SortDir | null
    const sortBy: SortBy = sortByParam && SORTABLE_FIELDS.has(sortByParam) ? sortByParam : "createdAt"
    const sortDir: SortDir = sortDirParam && SORT_DIRECTIONS.has(sortDirParam) ? sortDirParam : "desc"
    const customFilters = parseCustomFilters(searchParams.get("filters"))

    const skip = (page - 1) * limit
    const take = limit
    const andConditions: any[] = [{ userId: session.user.id }]

    if (search) {
      andConditions.push({
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } }
        ]
      })
    }

    if (tag) {
      andConditions.push({
        contactTags: {
          some: {
            tag: {
              name: { contains: tag, mode: "insensitive" }
            }
          }
        }
      })
    }

    for (const rule of customFilters) {
      const where = customFilterToWhere(rule)
      if (where) andConditions.push(where)
    }

    const where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          lists: {
            include: {
              contactList: true
            }
          },
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
        orderBy: buildOrderBy(sortBy, sortDir),
        skip,
        take
      }),
      prisma.contact.count({
        where
      })
    ])

    const pages = Math.ceil(total / limit)

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

    return NextResponse.json({
      contacts: mappedContacts,
      pagination: {
        page,
        limit,
        total,
        pages,
        currentPage: page,
        totalPages: pages,
        totalContacts: total,
        sortBy,
        sortDir
      },
      currentPage: page,
      totalPages: pages,
      totalContacts: total,
      limit,
      sortBy,
      sortDir
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}

import { z } from "zod"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const createContactSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Normalize email to lowercase
    const normalizedEmail = validatedData.email.trim().toLowerCase()

    // Prevent duplicate emails per tenant (user.id)
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId,
        email: normalizedEmail
      }
    })

    if (existingContact) {
      return NextResponse.json(
        { error: "A contact with this email address already exists in your workspace." },
        { status: 409 }
      )
    }

    // Validate custom fields using value-service
    let operations: any[] = []
    if (validatedData.customFields !== undefined) {
      const { CustomValueService } = require("@/lib/custom-fields/value-service")
      try {
        operations = await CustomValueService.validateCustomFieldValues(
          userId,
          validatedData.customFields
        )
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
    }

    const newContact = await prisma.$transaction(async (tx: any) => {
      // 1. Create base contact
      const contact = await tx.contact.create({
        data: {
          userId,
          email: normalizedEmail,
          firstName: validatedData.firstName || null,
          lastName: validatedData.lastName || null,
          phone: validatedData.phone || null,
          company: validatedData.company || null,
          city: validatedData.city || null,
          status: "ACTIVE",
          source: "MANUAL"
        }
      })

      // 2. Perform custom fields operations
      for (const op of operations) {
        if (op.action === "UPSERT") {
          await tx.contactFieldValue.create({
            data: {
              contactId: contact.id,
              fieldId: op.fieldId,
              ...op.values
            }
          })
        }
      }

      // 3. Resolve tags
      if (validatedData.tags) {
        const tagList = validatedData.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)

        const uniqueTags = Array.from(new Set(tagList))

        for (const name of uniqueTags) {
          const slug = slugify(name)
          if (!slug) continue

          let tag = await tx.tag.findUnique({
            where: {
              userId_slug: {
                userId,
                slug
              }
            }
          })

          if (!tag) {
            tag = await tx.tag.create({
              data: {
                name,
                slug,
                userId,
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

      return contact
    })

    // Fetch dynamic tags and flat custom fields for the response
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
      success: true,
      contact: {
        ...newContact,
        tags: relationTagsStr,
        customFields
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating contact:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.format() },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to create contact" },
      { status: 500 }
    )
  }
}

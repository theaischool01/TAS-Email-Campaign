import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { canAccessResource } from "@/lib/rbac-filters"

const prisma = prismaClient as any

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

    const listIds = id.split(",").map(s => s.trim()).filter(Boolean)
    if (listIds.length === 0) {
      return NextResponse.json({ error: "No lists selected" }, { status: 400 })
    }

    const contactLists = await prisma.contactList.findMany({
      where: { id: { in: listIds } }
    })

    if (contactLists.length === 0) {
      return NextResponse.json({ error: "Contact lists not found" }, { status: 404 })
    }

    // Verify access to all requested lists
    for (const list of contactLists) {
      if (!canAccessResource(session, list.ownerId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Run SQL query to get all non-null field values for unique active contacts across all selected lists
    const rawRows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        f.id AS "fieldId",
        f.key AS "fieldKey",
        f."displayName" AS "fieldDisplayName",
        f.type AS "fieldType",
        f.options AS "fieldOptions",
        v."textValue",
        v."numberValue",
        v."dateValue",
        v."booleanValue",
        v."jsonValue"
      FROM contact_field_values v
      JOIN contact_custom_fields f ON f.id = v."fieldId"
      WHERE v."contactId" IN (
        SELECT DISTINCT m."contactId"
        FROM contact_list_members m
        JOIN contacts c ON c.id = m."contactId"
        WHERE m."contactListId" = ANY($1::text[]) AND c.status = 'ACTIVE'
      ) AND f."isArchived" = false
    `, listIds)

    // Group and aggregate in memory
    const fieldsMap = new Map<string, {
      key: string
      displayName: string
      type: string
      options: string[]
      valueCounts: Map<string, number>
    }>()

    for (const row of rawRows) {
      if (!fieldsMap.has(row.fieldKey)) {
        let parsedOptions: string[] = []
        if (row.fieldOptions) {
          try {
            const parsed = JSON.parse(row.fieldOptions)
            if (Array.isArray(parsed)) {
              parsedOptions = parsed.map(o => String(o))
            }
          } catch (_) {
            parsedOptions = row.fieldOptions.split(",").map((s: string) => s.trim()).filter(Boolean)
          }
        }

        fieldsMap.set(row.fieldKey, {
          key: row.fieldKey,
          displayName: row.fieldDisplayName,
          type: row.fieldType,
          options: parsedOptions,
          valueCounts: new Map<string, number>()
        })
      }

      const entry = fieldsMap.get(row.fieldKey)!
      const type = row.fieldType

      if (type === "TEXT" || type === "DROPDOWN") {
        if (row.textValue !== null && row.textValue !== undefined && row.textValue !== "") {
          const val = String(row.textValue).trim()
          entry.valueCounts.set(val, (entry.valueCounts.get(val) || 0) + 1)
        }
      } else if (type === "NUMBER") {
        if (row.numberValue !== null && row.numberValue !== undefined) {
          const val = String(row.numberValue)
          entry.valueCounts.set(val, (entry.valueCounts.get(val) || 0) + 1)
        }
      } else if (type === "BOOLEAN") {
        if (row.booleanValue !== null && row.booleanValue !== undefined) {
          const val = String(row.booleanValue)
          entry.valueCounts.set(val, (entry.valueCounts.get(val) || 0) + 1)
        }
      } else if (type === "DATE") {
        if (row.dateValue !== null && row.dateValue !== undefined) {
          // Format date as YYYY-MM-DD
          const d = new Date(row.dateValue)
          const val = d.toISOString().split('T')[0]
          entry.valueCounts.set(val, (entry.valueCounts.get(val) || 0) + 1)
        }
      } else if (type === "MULTI_SELECT") {
        if (row.jsonValue) {
          try {
            const parsed = JSON.parse(row.jsonValue)
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                const val = String(item).trim()
                if (val !== "") {
                  entry.valueCounts.set(val, (entry.valueCounts.get(val) || 0) + 1)
                }
              }
            }
          } catch (_) {}
        }
      }
    }

    const fields = Array.from(fieldsMap.values())
      .map(entry => {
        const distinctValues = Array.from(entry.valueCounts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))

        return {
          key: entry.key,
          displayName: entry.displayName,
          type: entry.type,
          options: entry.options,
          totalValues: distinctValues.reduce((sum, curr) => sum + curr.count, 0),
          distinctValues
        }
      })
      .filter(field => field.totalValues > 0) // only fields containing data

    return NextResponse.json({ fields })
  } catch (error) {
    console.error("Error fetching list fields:", error)
    return NextResponse.json(
      { error: "Failed to fetch list fields" },
      { status: 500 }
    )
  }
}

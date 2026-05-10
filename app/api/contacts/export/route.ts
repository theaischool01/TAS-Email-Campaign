import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { ContactAccessControl } from "@/lib/rbac/contact-access"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    const filter = ContactAccessControl.getContactVisibilityFilter(session)
    
    const contacts = await prisma.contact.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    })

    // Generate CSV
    const headers = ["Email", "First Name", "Last Name", "Phone", "Company", "City", "Status", "Source", "Created At"]
    const rows = contacts.map((contact: any) => [
      contact.email,
      contact.firstName || "",
      contact.lastName || "",
      contact.phone || "",
      contact.company || "",
      contact.city || "",
      contact.status,
      contact.source,
      contact.createdAt.toISOString()
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contacts-export.csv"`
      }
    })
  } catch (error) {
    console.error("📊 Contact Export Error:", error)
    return new Response("Failed to generate export", { status: 500 })
  }
}

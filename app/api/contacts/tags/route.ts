import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contacts = await prisma.contact.findMany({
      where: { userId: session.user.id },
      select: { tags: true }
    })

    const tagsSet = new Set<string>()
    contacts.forEach((c: any) => {
      if (c.tags) {
        c.tags.split(",").forEach((t: string) => {
          const trimmed = t.trim()
          if (trimmed) {
            tagsSet.add(trimmed)
          }
        })
      }
    })

    return NextResponse.json({ tags: Array.from(tagsSet) })
  } catch (error) {
    console.error("Error fetching unique tags:", error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}

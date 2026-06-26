import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, slug: true, color: true }
    })

    // Return both formats for maximum compatibility
    const tagsList = tags.map((t: any) => t.name)

    return NextResponse.json({ tags: tagsList, details: tags })
  } catch (error) {
    console.error("Error fetching unique tags:", error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color = "#3B82F6" } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 })
    }

    const slug = slugify(name)

    const tag = await prisma.tag.upsert({
      where: {
        userId_slug: {
          userId: session.user.id,
          slug
        }
      },
      update: {
        name,
        color
      },
      create: {
        name,
        slug,
        userId: session.user.id,
        color
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    )
  }
}

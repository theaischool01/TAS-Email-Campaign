import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

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

    // Find the tag first
    const tag = await prisma.tag.findUnique({
      where: { id }
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    if (tag.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete tag (onDelete: Cascade will handle contactTags)
    await prisma.tag.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Tag deleted successfully" })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { canAccessResource } from "@/lib/rbac-filters"
import { sanitizeEmailHTML } from "@/lib/security/html-sanitizer"

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

    // Find the template first
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    if (template.isSystem) {
      // Find personal copy first
      const personalCopy = await prisma.emailTemplate.findFirst({
        where: {
          createdBy: session.user.id,
          systemTemplateId: template.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      if (personalCopy) {
        return NextResponse.json(personalCopy)
      }

      // Auto-create personal copy
      const newCopy = await prisma.emailTemplate.create({
        data: {
          name: template.name,
          html: template.html,
          json: template.json,
          category: template.category,
          isSystem: false,
          systemTemplateId: template.id,
          createdBy: session.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      })

      return NextResponse.json(newCopy)
    }

    // Check if user can access this template
    if (!canAccessResource(session, template.createdBy)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the template first
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if user can edit this template
    const canEdit = template.createdBy === session.user.id && !template.isSystem

    if (!canEdit) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, html, json, isPublic } = body

    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(html && { html: sanitizeEmailHTML(html) }),
        ...(json !== undefined && { json }),
        ...(isPublic !== undefined && { isPublic })
      }
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
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

    // Find the template first
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check if user can delete this template
    const canDelete = template.createdBy === session.user.id && !template.isSystem

    if (!canDelete) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    await prisma.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Template deleted successfully" })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}

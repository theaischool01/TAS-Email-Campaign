import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { TemplateAccessControl } from "@/lib/rbac/template-access"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const category = url.searchParams.get("category") || ""

    // Get templates with centralized RBAC filtering
    const visibilityFilter = TemplateAccessControl.getTemplateVisibilityFilter(session)
    console.log("🔍 API Debug - Session:", session.user)
    console.log("🔍 API Debug - Visibility Filter:", visibilityFilter)
    console.log("🔍 API Debug - Search:", search)
    console.log("🔍 API Debug - Category:", category)
    
    // Build query with centralized visibility filter + search/category
    let whereClause = { ...visibilityFilter }
    
    if (search) {
      whereClause = {
        ...whereClause,
        name: {
          contains: search,
          mode: "insensitive"
        }
      }
    }
    
    if (category) {
      whereClause = {
        ...whereClause,
        category: {
          contains: category,
          mode: "insensitive"
        }
      }
    }

    const templates = await prisma.emailTemplate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })

    console.log("📊 Templates fetched:", templates.map(t => ({ id: t.id, name: t.name, category: t.category, createdBy: t.createdBy, isPublic: t.isPublic })))
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
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

    // Check if user can create templates
    if (session.user.role === "VIEWER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { name, category, html, json, isPublic = false } = body

    if (!name || !html) {
      return NextResponse.json({ error: "Name and HTML content are required" }, { status: 400 })
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        category,
        html,
        json,
        isPublic,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

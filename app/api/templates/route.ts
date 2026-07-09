import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { TemplateService } from "@/lib/services/template.service"
import { sanitizeEmailHTML } from "@/lib/security/html-sanitizer"
import { renderBlocksToHTML } from "@/components/templates/utils/html-renderer"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const category = url.searchParams.get("category") || ""

    // Use centralized service for consistent RBAC across platform
    const templates = await TemplateService.getTemplates(session, prisma, { search, category })

    return NextResponse.json({
      success: true,
      templates
    })
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


    const body = await request.json()
    // Note: client-submitted `html` is intentionally ignored.
    // We always regenerate HTML server-side from `json` to guarantee
    // template.html is always the canonical render of the block model.
    const { name, category, json, isPublic = false } = body

    if (!name || !json) {
      return NextResponse.json({ error: "Name and JSON content are required" }, { status: 400 })
    }

    // Always regenerate HTML server-side from the block JSON
    let generatedHtml = ""
    try {
      const parsedBlocks = JSON.parse(json)
      generatedHtml = renderBlocksToHTML(parsedBlocks)
    } catch {
      return NextResponse.json({ error: "Invalid JSON block data" }, { status: 400 })
    }

    try {
      const template = await prisma.emailTemplate.create({
        data: {
          name,
          category,
          html: sanitizeEmailHTML(generatedHtml),
          json,
          isPublic,
          createdBy: session.user.id
        }
      })

      return NextResponse.json(template, { status: 201 })
    } catch (error: any) {
      // Handle Prisma unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "A template with this name already exists for your account" },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

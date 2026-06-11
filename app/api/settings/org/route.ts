import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { encrypt, decrypt } from "@/lib/security/encryption"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await (prisma as any).settings.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({
      success: true,
      data: settings ? {
        ...settings,
        awsAccessKey: "",
        awsSecretKey: "",
        awsRegion: "",
        defaultFromEmail: "",
        defaultFromName: ""
      } : {
        orgName: "My Organisation",
        orgLogo: "",
        defaultFromEmail: "",
        defaultFromName: "",
        awsAccessKey: "",
        awsSecretKey: "",
        awsRegion: "us-east-1"
      }
    })
  } catch (error: any) {
    console.error("Settings GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      orgName, 
      orgLogo
    } = body

    const settings = await (prisma as any).settings.upsert({
      where: { userId: session.user.id },
      update: {
        orgName,
        orgLogo
      },
      create: {
        userId: session.user.id,
        orgName,
        orgLogo
      }
    })

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error: any) {
    console.error("Settings POST Error:", error)
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 })
  }
}

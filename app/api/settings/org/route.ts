import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await (prisma as any).settings.findUnique({
      where: { id: "system" }
    })

    return NextResponse.json({
      success: true,
      data: settings || {
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
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      orgName, 
      orgLogo, 
      defaultFromEmail, 
      defaultFromName,
      awsAccessKey,
      awsSecretKey,
      awsRegion
    } = body

    const settings = await (prisma as any).settings.upsert({
      where: { id: "system" },
      update: {
        orgName,
        orgLogo,
        defaultFromEmail,
        defaultFromName,
        awsAccessKey,
        awsSecretKey,
        awsRegion
      },
      create: {
        id: "system",
        orgName,
        orgLogo,
        defaultFromEmail,
        defaultFromName,
        awsAccessKey,
        awsSecretKey,
        awsRegion
      }
    })

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error: any) {
    console.error("Settings POST Error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

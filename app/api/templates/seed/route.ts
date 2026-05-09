import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient() as any

const defaultTemplates = [
  {
    name: "Promotional Offer",
    category: "Promotional",
    description: "A standard template for sales and promotional offers.",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; padding: 20px 0; background-color: #f3f4f6; border-radius: 6px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Special Offer!</h1>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 15px;">Don't miss out on our latest deals!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
          We are excited to offer you an exclusive discount. Click the button below to claim your offer and start saving today.
        </p>
        <div style="text-align: center;">
          <a href="#" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Claim Your Discount</a>
        </div>
      </div>
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 14px;">© 2026 Your Company. All rights reserved.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
          <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>`,
    json: JSON.stringify({}) // Basic empty grapesjs json
  },
  {
    name: "Monthly Newsletter",
    category: "Newsletter",
    description: "A clean layout for your monthly updates and news.",
    html: `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 30px; border-top: 5px solid #10b981;">
      <h1 style="color: #111827; font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">Monthly Newsletter</h1>
      
      <div style="margin-top: 25px;">
        <h3 style="color: #1f2937; font-size: 18px;">Latest Update</h3>
        <p style="color: #4b5563; line-height: 1.6;">Welcome to our latest newsletter. Here are the top stories and updates from our team this month.</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; margin-top: 20px; border-left: 4px solid #10b981;">
        <h4 style="color: #111827; margin-top: 0;">Featured Story</h4>
        <p style="color: #4b5563; margin-bottom: 0; line-height: 1.5;">Learn about our newest feature release that will help you work faster and more efficiently than ever before.</p>
        <a href="#" style="color: #10b981; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 10px;">Read More →</a>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 12px;">You received this email because you are subscribed to our newsletter.</p>
      </div>
    </div>`,
    json: JSON.stringify({})
  },
  {
    name: "Event Invitation",
    category: "Event",
    description: "Invite your audience to webinars or live events.",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #8b5cf6; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 32px;">You're Invited!</h1>
        <p style="font-size: 18px; opacity: 0.9; margin-top: 10px;">Join us for our upcoming exclusive event.</p>
      </div>
      <div style="padding: 30px;">
        <div style="background-color: #f5f3ff; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center;">
          <h3 style="color: #6d28d9; margin: 0 0 10px 0;">Event Details</h3>
          <p style="margin: 5px 0; color: #4c1d95;"><strong>Date:</strong> October 25, 2026</p>
          <p style="margin: 5px 0; color: #4c1d95;"><strong>Time:</strong> 10:00 AM EST</p>
          <p style="margin: 5px 0; color: #4c1d95;"><strong>Location:</strong> Virtual via Zoom</p>
        </div>
        <p style="color: #4b5563; line-height: 1.6;">We have prepared an exciting agenda with industry experts. Space is limited, so please RSVP as soon as possible to secure your spot.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">RSVP Now</a>
        </div>
      </div>
    </div>`,
    json: JSON.stringify({})
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Insert templates
    let createdCount = 0;
    for (const tpl of defaultTemplates) {
      // Check if already exists to avoid duplicates
      const existing = await prisma.emailTemplate.findUnique({
        where: {
          createdBy_name: {
            createdBy: session.user.id,
            name: tpl.name
          }
        }
      });

      if (!existing) {
        await prisma.emailTemplate.create({
          data: {
            ...tpl,
            createdBy: session.user.id,
            isPublic: true
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${createdCount} templates for user ${session.user.id}`
    })
  } catch (error: any) {
    console.error("Failed to seed templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

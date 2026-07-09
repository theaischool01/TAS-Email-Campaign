import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    defaultFromName: process.env.DEFAULT_FROM_NAME || "THE AI SCHOOL",
    defaultFromEmail: process.env.DEFAULT_FROM_EMAIL || process.env.SES_FROM_EMAIL || "official@campaign.theaischool.co"
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { ReorderCustomFieldSchema } from "@/lib/custom-fields/schema";

const prisma = prismaClient as any;

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ReorderCustomFieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const items = parsed.data;
    if (items.length === 0) {
      return NextResponse.json({ success: true });
    }

    const fieldIds = items.map(item => item.id);

    // Verify all fields exist and belong to this tenant
    const fields = await prisma.contactCustomField.findMany({
      where: {
        id: { in: fieldIds },
        userId: session.user.id
      },
      select: { id: true }
    });

    if (fields.length !== fieldIds.length) {
      return NextResponse.json(
        { error: "One or more field IDs are invalid or belong to another tenant." },
        { status: 403 }
      );
    }

    // Execute updates inside a single Prisma transaction
    await prisma.$transaction(
      items.map(item =>
        prisma.contactCustomField.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error batch reordering custom fields:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder custom fields" },
      { status: 500 }
    );
  }
}

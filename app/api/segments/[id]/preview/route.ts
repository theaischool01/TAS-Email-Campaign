import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { SegmentQueryCompiler } from "@/lib/segments/compiler";
import { CustomFieldMeta } from "@/lib/segments/validator";

const prisma = prismaClient as any;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Load segment
    const segment = await prisma.segment.findFirst({
      where: { id, userId }
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const criteria = segment.criteria;
    if (!criteria) {
      return NextResponse.json({ contacts: [] });
    }

    // Load custom fields metadata
    const dbCustomFields = await prisma.contactCustomField.findMany({
      where: { userId }
    });

    const fieldRegistry = new Map<string, CustomFieldMeta>(
      dbCustomFields.map((cf: any) => [
        cf.key.toLowerCase(),
        { id: cf.id, key: cf.key, type: cf.type }
      ])
    );

    // Compile in STREAM mode to fetch IDs
    let { sql, values } = SegmentQueryCompiler.compile(userId, criteria, fieldRegistry, {
      mode: "STREAM",
      batchSize: 10
    });

    // Exclude suppressed
    sql += ` AND c.email NOT IN (SELECT email FROM suppression_list WHERE "userId" = $1)`;

    const rawResults = await prisma.$queryRawUnsafe(sql, ...values) as Array<{ id: string }>;
    if (rawResults.length === 0) {
      return NextResponse.json({ contacts: [] });
    }

    const contactIds = rawResults.map(r => r.id);

    // Fetch complete contact profiles
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      include: {
        contactTags: {
          include: {
            tag: true
          }
        },
        customFieldValues: {
          include: {
            customField: true
          }
        }
      }
    });

    // Map database structures to flattened format
    const flattenedContacts = contactIds.map(id => {
      const contact = contacts.find((c: any) => c.id === id);
      if (!contact) return null;

      // Extract tags
      const tags = contact.contactTags.map((ct: any) => ct.tag?.name).filter(Boolean).join(",");

      // Extract custom fields mapping key -> typed value
      const customFields: Record<string, any> = {};
      contact.customFieldValues.forEach((val: any) => {
        if (!val.customField) return;
        const key = val.customField.key;
        let value: any = null;
        if (val.textValue !== null) value = val.textValue;
        else if (val.numberValue !== null) value = val.numberValue;
        else if (val.dateValue !== null) value = val.dateValue;
        else if (val.booleanValue !== null) value = val.booleanValue;
        else if (val.jsonValue !== null) {
          try {
            value = JSON.parse(val.jsonValue);
          } catch (e) {
            value = null;
          }
        }
        customFields[key] = value;
      });

      return {
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        tags,
        customFields
      };
    }).filter(Boolean);

    return NextResponse.json({ contacts: flattenedContacts });
  } catch (error: any) {
    console.error("GET /api/segments/[id]/preview error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch segment preview" },
      { status: 500 }
    );
  }
}

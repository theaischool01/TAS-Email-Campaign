import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { CreateCustomFieldSchema } from "@/lib/custom-fields/schema";
import { generateCustomFieldKey } from "@/lib/custom-fields/key-generator";
import { isReservedField } from "@/lib/custom-fields/reserved-fields";

const prisma = prismaClient as any;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const customFields = await prisma.contactCustomField.findMany({
      where: {
        userId: session.user.id,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: {
        displayOrder: "asc"
      }
    });

    // Parse dropdown/multi_select options from JSON string back to array
    const formattedFields = customFields.map((field: any) => {
      let parsedOptions = null;
      if (field.options) {
        try {
          parsedOptions = JSON.parse(field.options);
        } catch (e) {
          parsedOptions = null;
        }
      }
      return {
        ...field,
        options: parsedOptions
      };
    });

    return NextResponse.json(formattedFields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom fields" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request structure
    const parsed = CreateCustomFieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const key = generateCustomFieldKey(data.displayName);

    // Guard against reserved fields
    if (isReservedField(key)) {
      return NextResponse.json(
        { error: `The name '${data.displayName}' conflicts with a system reserved field.` },
        { status: 400 }
      );
    }

    // Execute check and insert within a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx: any) => {
      // Check for duplicate key
      const duplicateKey = await tx.contactCustomField.findFirst({
        where: {
          userId: session.user.id,
          key
        }
      });
      if (duplicateKey) {
        return { error: `A custom field with key '${key}' already exists in your workspace.`, status: 409 };
      }

      // Check for duplicate display name (case-insensitive)
      const duplicateName = await tx.contactCustomField.findFirst({
        where: {
          userId: session.user.id,
          displayName: { equals: data.displayName.trim(), mode: "insensitive" }
        }
      });
      if (duplicateName) {
        return { error: `A custom field named '${data.displayName}' already exists in your workspace.`, status: 409 };
      }

      // Create new custom field
      const createdField = await tx.contactCustomField.create({
        data: {
          userId: session.user.id,
          key,
          displayName: data.displayName.trim(),
          type: data.type,
          options: data.options ? JSON.stringify(data.options) : null,
          isRequired: data.isRequired,
          defaultValue: data.defaultValue || null,
          validationType: data.validationType,
          validationRegex: data.validationRegex || null,
          displayOrder: data.displayOrder
        }
      });

      return { success: true, data: createdField };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Return the response, parsing the options JSON string back to array
    const returnedData = {
      ...result.data,
      options: result.data.options ? JSON.parse(result.data.options) : null
    };

    return NextResponse.json(returnedData, { status: 201 });
  } catch (error: any) {
    console.error("Error creating custom field:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create custom field" },
      { status: 500 }
    );
  }
}

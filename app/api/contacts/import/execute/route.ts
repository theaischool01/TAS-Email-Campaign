import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { generateCustomFieldKey } from "@/lib/custom-fields/key-generator";
import { isReservedField } from "@/lib/custom-fields/reserved-fields";
import { ImportService, ImportMapping } from "@/lib/services/import-service";
// @ts-ignore
import Papa from "papaparse";

const prisma = prismaClient as any;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { csvText, targetListId, mappings, autoCreateDropdownOptions } = body;

    if (!csvText) {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    if (!targetListId) {
      return NextResponse.json({ error: "No target list selected" }, { status: 400 });
    }

    if (!mappings || typeof mappings !== "object") {
      return NextResponse.json({ error: "No mappings provided" }, { status: 400 });
    }

    // Parse CSV to get rows
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    const rows = parsed.data as any[];

    // 1. Double check list existence and ownership
    const list = await prisma.contactList.findFirst({
      where: {
        id: targetListId,
        ownerId: session.user.id,
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 });
    }

    // 2. Pre-process mappings: Create dynamic custom fields
    const finalMappings: Record<string, ImportMapping> = {};

    for (const [csvHeader, mapVal] of Object.entries(mappings) as [string, any][]) {
      if (mapVal.action === "CREATE_CUSTOM_FIELD") {
        const displayName = mapVal.displayName?.trim();
        const fieldType = mapVal.fieldType || "TEXT";
        const isRequired = !!mapVal.isRequired;
        const options = mapVal.options ? JSON.stringify(mapVal.options) : null;

        if (!displayName) {
          return NextResponse.json(
            { error: `Display name is required for creating a custom field from header '${csvHeader}'` },
            { status: 400 }
          );
        }

        const key = generateCustomFieldKey(displayName);

        if (isReservedField(key)) {
          return NextResponse.json(
            { error: `The name '${displayName}' conflicts with a system reserved field.` },
            { status: 400 }
          );
        }

        // Create the custom field inside transaction to prevent duplicates/race conditions
        const fieldResult = await prisma.$transaction(async (tx: any) => {
          // Check duplicate key
          const duplicateKey = await tx.contactCustomField.findFirst({
            where: {
              userId: session.user.id,
              key,
            },
          });

          if (duplicateKey) {
            // If it already exists (maybe created by a parallel process or already exists), reuse it
            return { success: true, fieldId: duplicateKey.id };
          }

          // Check duplicate display name (case-insensitive)
          const duplicateName = await tx.contactCustomField.findFirst({
            where: {
              userId: session.user.id,
              displayName: { equals: displayName, mode: "insensitive" },
            },
          });

          if (duplicateName) {
            return { success: true, fieldId: duplicateName.id };
          }

          // Create new field
          const created = await tx.contactCustomField.create({
            data: {
              userId: session.user.id,
              key,
              displayName,
              type: fieldType,
              options,
              isRequired,
              displayOrder: 0,
            },
          });

          return { success: true, fieldId: created.id };
        });

        finalMappings[csvHeader] = {
          action: "MAP_CUSTOM_FIELD",
          fieldId: fieldResult.fieldId,
        };
      } else {
        finalMappings[csvHeader] = mapVal;
      }
    }

    // 3. Trigger Shared ImportService Ingestion
    const importResult = await ImportService.importContacts(
      session.user.id,
      targetListId,
      rows,
      finalMappings,
      prisma,
      { autoCreateDropdownOptions: !!autoCreateDropdownOptions }
    );

    return NextResponse.json(importResult);
  } catch (error: any) {
    console.error("Execute import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute import" },
      { status: 500 }
    );
  }
}

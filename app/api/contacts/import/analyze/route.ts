import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
// @ts-ignore
import Papa from "papaparse";

const prisma = prismaClient as any;

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s\-\/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json({ error: "Only CSV and Excel (.xlsx, .xls) files are supported" }, { status: 400 });
    }

    let csvText = "";
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const XLSX = require("xlsx");
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      csvText = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      csvText = await file.text();
    }

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const fields = (parsed.meta?.fields ?? []) as string[];
    const rows = parsed.data as any[];

    // Normalize headers to identify columns
    const normalizedFields = fields.map(f => f.trim().toLowerCase());
    const emailIndex = normalizedFields.findIndex(f => f === "email");

    // Locked Rule 2: Analyze API must reject files without an email column
    if (emailIndex === -1) {
      return NextResponse.json(
        { error: "The uploaded CSV must contain an 'Email' column." },
        { status: 400 }
      );
    }

    // Load custom fields for the tenant
    const customFields = await prisma.contactCustomField.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
    });

    const customFieldsMap = new Map<string, any>(
      customFields.map((cf: any) => [cf.key.toLowerCase(), cf])
    );

    const columns = fields.map((header) => {
      const norm = header.trim().toLowerCase();
      let suggestion = null;

      // Match system fields with aliases
      if (norm === "email") {
        suggestion = { type: "SYSTEM", field: "email" };
      } else if (norm === "name") {
        suggestion = { type: "SYSTEM", field: "name" };
      } else if (norm === "firstname" || norm === "first name" || norm === "first_name") {
        suggestion = { type: "SYSTEM", field: "firstName" };
      } else if (norm === "lastname" || norm === "last name" || norm === "last_name") {
        suggestion = { type: "SYSTEM", field: "lastName" };
      } else if (norm === "phone") {
        suggestion = { type: "SYSTEM", field: "phone" };
      } else if (norm === "company") {
        suggestion = { type: "SYSTEM", field: "company" };
      } else if (norm === "city") {
        suggestion = { type: "SYSTEM", field: "city" };
      } else if (norm === "tags") {
        suggestion = { type: "SYSTEM", field: "tags" };
      } else {
        // Match existing custom fields
        const matchedCf = customFieldsMap.get(norm) || customFieldsMap.get(normalizeHeader(header));
        if (matchedCf) {
          suggestion = { type: "CUSTOM", fieldId: matchedCf.id };
        }
      }

      return {
        header,
        suggestion,
      };
    });

    return NextResponse.json({
      totalRows: rows.length,
      columns,
    });
  } catch (error: any) {
    console.error("Error analyzing CSV:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze CSV" },
      { status: 500 }
    );
  }
}

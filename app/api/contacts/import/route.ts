import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { enforceRateLimit, getClientIp, handleRateLimitError } from "@/lib/security/rate-limit";
import { prisma as prismaClient } from "@/app/lib/prisma";
// @ts-ignore
import Papa from "papaparse";
import { ImportService } from "@/lib/services/import-service";

const prisma = prismaClient as any;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce dual rate limiting: User quota & IP quota
    const ip = getClientIp(request);
    try {
      await enforceRateLimit("csvImportUser", `import:user:${session.user.id}`);
      await enforceRateLimit("csvImportIp", `import:ip:${ip}`);
    } catch (limitErr) {
      const errorRes = handleRateLimitError(limitErr);
      if (errorRes) return errorRes;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetListId = formData.get("targetListId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!targetListId) {
      return NextResponse.json({ error: "No list selected" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are supported" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 25MB" }, { status: 400 });
    }

    const targetList = await prisma.contactList.findFirst({
      where: {
        id: targetListId,
        ownerId: session.user.id,
      },
    });

    if (!targetList) {
      return NextResponse.json({ error: "Contact list not found" }, { status: 404 });
    }

    const csvText = await file.text();

    // Parse with PapaParse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as Record<string, string>[];

    const result = await ImportService.importContacts(
      session.user.id,
      targetListId,
      rows,
      {},
      prisma
    );

    return NextResponse.json({
      success: true,
      results: {
        total: result.results.total,
        newContactsCreated: result.results.newContactsCreated,
        existingContactsAddedToList: result.results.existingContactsAddedToList,
        alreadyInList: result.results.alreadyInList,
        ignored: result.results.ignored,
        failed: result.results.failed,
      },
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import contacts" },
      { status: 500 }
    );
  }
}

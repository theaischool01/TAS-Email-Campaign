import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma as prismaClient } from "@/app/lib/prisma";
import logger from "@/lib/logger";
import { seedDefaultTemplatesForUser } from "@/lib/services/default-template.service";
import { enforceRateLimit, getClientIp, handleRateLimitError } from "@/lib/security/rate-limit";

const prisma = prismaClient as any;

// Zod schema for signup validation
const signupSchema = z.object({
  name: z.string().min(1, "Full Name is required"),
  email: z.string().email("Valid email format is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: NextRequest) {
  let emailForLog = "unknown";
  try {
    // 1. Rate Limiting Check
    const ip = getClientIp(request);
    const rateLimitKey = ip ? `signup:${ip}` : "signup:unknown";
    try {
      await enforceRateLimit("signup", rateLimitKey);
    } catch (limitErr) {
      const errorRes = handleRateLimitError(limitErr);
      if (errorRes) return errorRes;
    }

    // 2. Validate Request Body
    const body = await request.json();
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join(", ");
      logger.warn({ event: "registration_failed", reason: "validation_error", errors: issues });
      return NextResponse.json({ error: `Validation failed: ${issues}` }, { status: 400 });
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();
    emailForLog = normalizedEmail;

    // 3. Database Transaction (Create User & Seed 65 Templates)
    const user = await prisma.$transaction(async (tx: any) => {
      // Check for existing user in transaction to prevent race conditions
      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new Error("Account already exists");
      }

      // Hash password (cost factor 12)
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new ADMIN role user (tenant owner)
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      return newUser;
    });

    logger.info({ event: "user_registered", userId: user.id, email: user.email }, "User registered successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Check if error is due to email already existing
    const isDuplicate =
      error.message === "Account already exists" ||
      error.code === "P2002" ||
      (error.message && error.message.toLowerCase().includes("unique constraint"));

    if (isDuplicate) {
      logger.warn({ event: "registration_failed", email: emailForLog, reason: "duplicate_email" }, "Registration failed: Email already exists");
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    logger.error({ event: "registration_failed", email: emailForLog, reason: error.message }, "User registration failed");
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

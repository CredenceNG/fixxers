import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { sendMagicLinkSMS } from "@/lib/sms";
import { z } from "zod";
import { authLimiter, getClientIdentifier, rateLimitResponse } from "@/lib/ratelimit";

const registerSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().optional(),
    role: z.enum(["CLIENT", "FIXER"]).optional(),
    roles: z.array(z.enum(["CLIENT", "FIXER"])).optional(),
    referralCode: z.string().optional(), // Quick Wins - Referral code from referrer
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
  });

export async function POST(request: NextRequest) {
  // Apply rate limiting (5 requests per 15 minutes per IP)
  const identifier = getClientIdentifier(request);
  const rateLimitResult = await authLimiter.limit(identifier);

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          validated.email ? { email: validated.email } : {},
          validated.phone ? { phone: validated.phone } : {},
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists. Please login instead." },
        { status: 400 }
      );
    }

    // Determine roles: use roles array if provided, otherwise fallback to role, default to CLIENT
    const roles =
      validated.roles && validated.roles.length > 0
        ? validated.roles
        : validated.role
        ? [validated.role]
        : ["CLIENT" as const];

    // Quick Wins - Check if referral code is valid
    let referredById: string | undefined;
    if (validated.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: validated.referralCode },
        select: { id: true },
      });

      if (referrer) {
        referredById = referrer.id;
      }
      // Note: We don't fail registration if referral code is invalid
      // Just ignore it and continue without the referral relationship
    }

    // Create new user with PENDING status
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        phone: validated.phone,
        name: validated.name,
        roles: roles,
        referredById, // Quick Wins - Link to referrer if code was valid
      },
    });

    // Generate magic link
    const token = await generateMagicLink(user.id);

    // Send magic link via email or SMS
    if (validated.email) {
      await sendMagicLinkEmail(validated.email, token, true);
    } else if (validated.phone) {
      await sendMagicLinkSMS(validated.phone, token, true);
    }

    return NextResponse.json({
      success: true,
      message: `Registration link sent to your ${
        validated.email ? "email" : "phone"
      }`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

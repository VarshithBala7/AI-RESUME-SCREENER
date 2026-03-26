import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createVerificationCode, getVerificationCodeExpiry } from "@/lib/utils";
import { sendVerificationCodeEmail } from "@/lib/mail";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Password and confirm password do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const payload = registerSchema.parse(await request.json());
    const normalizedEmail = payload.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existing?.emailVerified) {
      return NextResponse.json({ error: "Email is already registered. Please sign in." }, { status: 409 });
    }

    const passwordHash = await hashPassword(payload.password);
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          name: payload.name,
          email: normalizedEmail,
          passwordHash,
        },
        select: {
          id: true,
        },
      }));

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: payload.name,
          passwordHash,
        },
      });
    }

    const rawCode = createVerificationCode();
    const codeHash = await hashPassword(rawCode);

    await prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        codeHash,
        expiresAt: getVerificationCodeExpiry(),
      },
    });

    await sendVerificationCodeEmail(normalizedEmail, rawCode);

    return NextResponse.json({
      message: "Account created successfully. Verification code sent to email.",
      email: normalizedEmail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid form values." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to register account." }, { status: 500 });
  }
}

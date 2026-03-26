import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendVerificationCodeEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationCodeRecord } from "@/lib/email-code";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. Please sign in." },
        { status: 409 },
      );
    }

    const plainCode = await createEmailVerificationCodeRecord(user.id, email);

    await sendVerificationCodeEmail(email, plainCode);

    return NextResponse.json({
      message: "Verification code sent.",
      email,
    });
  } catch (error) {
    console.error("send verification error", error);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}

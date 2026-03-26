import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationCode, getVerificationCodeExpiry } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/mail";

const schema = z.object({
  email: z.email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    if (existing?.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Please sign in." },
        { status: 409 },
      );
    }

    const code = createVerificationCode();
    const expiresAt = getVerificationCodeExpiry();

    await prisma.emailVerificationCode.upsert({
      where: { email: body.email.toLowerCase() },
      update: {
        code,
        expiresAt,
      },
      create: {
        email: body.email.toLowerCase(),
        code,
        expiresAt,
      },
    });

    await sendVerificationEmail(body.email, code);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error("send-verification error:", error);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}

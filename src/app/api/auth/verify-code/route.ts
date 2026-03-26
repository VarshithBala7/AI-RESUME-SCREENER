import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailCodeSchema } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = verifyEmailCodeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }

    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        verificationCodes: {
          where: { used: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const latestCode = user.verificationCodes[0];
    if (!latestCode) {
      return NextResponse.json({ message: "No active verification code. Please request a new code." }, { status: 400 });
    }

    const expired = latestCode.expiresAt.getTime() < Date.now();
    if (expired) {
      return NextResponse.json({ message: "Verification code expired. Please request a new code." }, { status: 400 });
    }

    if (latestCode.code !== code) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.verificationCode.update({
        where: { id: latestCode.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("verify-code error", error);
    return NextResponse.json({ message: "Failed to verify code" }, { status: 500 });
  }
}

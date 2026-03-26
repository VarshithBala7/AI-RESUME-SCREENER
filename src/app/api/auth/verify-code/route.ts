import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailCodeSchema } from "@/lib/constants";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const json =
      contentType.includes("application/json")
        ? await request.json()
        : Object.fromEntries((await request.formData()).entries());
    const parsed = verifyEmailCodeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const { code } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const latestCode = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        email,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestCode) {
      return NextResponse.json(
        { message: "No active verification code. Please request a new code." },
        { status: 400 }
      );
    }

    const expired = latestCode.expiresAt.getTime() < Date.now();
    if (expired) {
      return NextResponse.json(
        { message: "Verification code expired. Please request a new code." },
        { status: 400 }
      );
    }

    const codeMatches = await verifyPassword(code, latestCode.codeHash);
    if (!codeMatches) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.emailVerificationCode.update({
        where: { id: latestCode.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("verify-code error", error);
    return NextResponse.json({ message: "Failed to verify code" }, { status: 500 });
  }
}

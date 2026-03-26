import { VERIFICATION_CODE_TTL_MINUTES } from "@/lib/constants";
import { hashVerificationCode } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createVerificationCode } from "@/lib/utils";

export async function createEmailVerificationCodeRecord(
  userId: string,
  email: string,
): Promise<string> {
  const code = createVerificationCode();
  const codeHash = await hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);

  await prisma.emailVerificationCode.create({
    data: {
      userId,
      email,
      codeHash,
      expiresAt,
    },
  });

  return code;
}

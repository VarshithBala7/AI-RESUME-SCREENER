import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { generateDocxBuffer } from "@/lib/exporters";

const bodySchema = z.object({
  atsResumeText: z.string().min(30),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "ATS resume text is required." }, { status: 400 });
  }

  const docxBuffer = await generateDocxBuffer(parsed.data.atsResumeText);

  return new NextResponse(new Uint8Array(docxBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="ats-resume.docx"',
    },
  });
}

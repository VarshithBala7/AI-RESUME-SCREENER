import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractResumeText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  if (mime.includes("pdf") || fileName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text || "";
  }

  if (
    mime.includes("word") ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  return buffer.toString("utf8");
}

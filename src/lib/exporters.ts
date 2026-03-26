import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const splitLines = (text: string, maxLength = 110): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
};

export async function generateDocxBuffer(content: string): Promise<Buffer> {
  const lines = content
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const children = lines.map((line) => {
    if (line === line.toUpperCase() && line.length <= 70) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: line, bold: true })],
      });
    }

    return new Paragraph({
      children: [new TextRun({ text: line })],
      spacing: { after: 140 },
    });
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generatePdfBuffer(content: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 48;
  const marginY = 52;
  const fontSize = 11;
  const lineHeight = 15;

  let cursorY = page.getHeight() - marginY;

  const addNewPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    cursorY = page.getHeight() - marginY;
  };

  const drawLine = (line: string, isHeading: boolean) => {
    if (cursorY < marginY + lineHeight) addNewPage();
    page.drawText(line, {
      x: marginX,
      y: cursorY,
      size: isHeading ? 12 : fontSize,
      font: isHeading ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: page.getWidth() - marginX * 2,
    });
    cursorY -= isHeading ? lineHeight + 3 : lineHeight;
  };

  const paragraphs = content.split("\n");
  for (const raw of paragraphs) {
    const text = raw.trim();
    if (!text) {
      cursorY -= 6;
      continue;
    }
    const isHeading = text === text.toUpperCase() && text.length < 70;
    const wrapped = splitLines(text, isHeading ? 95 : 105);
    for (const wrappedLine of wrapped) {
      drawLine(wrappedLine, isHeading);
    }
  }

  return Buffer.from(await pdf.save());
}

export const exportAtsAsDocxBuffer = generateDocxBuffer;
export const exportAtsAsPdfBuffer = generatePdfBuffer;

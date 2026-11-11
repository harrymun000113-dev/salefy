import { errorResponse, UserFacingError } from "@/lib/claude";

export const runtime = "nodejs";
const MAX_BYTES = 4 * 1024 * 1024; // Vercel 요청 본문 한도(4.5MB) 안쪽

/** 업로드한 PDF / DOCX / TXT에서 텍스트만 뽑아 돌려줍니다. */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new UserFacingError("파일이 없습니다.");
    if (file.size > MAX_BYTES) throw new UserFacingError("파일이 너무 큽니다 (최대 4MB).");

    const name = file.name.toLowerCase();
    const buf = new Uint8Array(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".pdf")) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(buf);
      const { text: pages } = await extractText(pdf, { mergePages: false });
      text = (pages as string[]).join("\n\n");
      if (!text.trim()) throw new UserFacingError("텍스트를 추출할 수 없습니다. 스캔 이미지 PDF일 수 있습니다.");
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
      text = value;
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = new TextDecoder().decode(buf);
    } else {
      throw new UserFacingError("PDF, DOCX, TXT 파일만 지원합니다.");
    }

    text = text.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    return Response.json({ text, name: file.name, chars: text.length });
  } catch (e) {
    return errorResponse(e);
  }
}

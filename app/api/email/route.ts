import { errorResponse, resolveApiKey, structuredCall, UserFacingError } from "@/lib/claude";
import { DEMO_EMAIL } from "@/lib/demo";
import { mockEmail } from "@/lib/mock";
import { SAMPLE_EMAIL } from "@/lib/samples";
import { EMAIL_SYSTEM, emailUserPrompt } from "@/lib/prompts";
import { EmailAnalysisSchema, EmailRequestSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const parsed = EmailRequestSchema.safeParse(await req.json());
    if (!parsed.success) throw new UserFacingError("입력값을 확인해주세요.");
    const body = parsed.data;

    const apiKey = resolveApiKey(req);
    // 키가 없으면 데모 모드: 예시 메일은 미리 만든 결과, 그 외에는 규칙 기반 분석
    if (!apiKey) {
      const data = body.message.trim() === SAMPLE_EMAIL.trim() ? DEMO_EMAIL : mockEmail(body);
      return Response.json({ data, demo: true });
    }

    const result = await structuredCall({
      apiKey,
      system: EMAIL_SYSTEM,
      user: emailUserPrompt(body),
      schema: EmailAnalysisSchema,
      effort: "medium",
    });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}

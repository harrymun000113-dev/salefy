import { errorResponse, resolveApiKey, structuredCall, UserFacingError } from "@/lib/claude";
import { DEMO_CONTRACT } from "@/lib/demo";
import { mockContract } from "@/lib/mock";
import { SAMPLE_NDA_REVISED, SAMPLE_NDA_TEMPLATE } from "@/lib/samples";
import { CONTRACT_SYSTEM, contractUserPrompt } from "@/lib/prompts";
import { ContractRequestSchema, ContractReviewSchema } from "@/lib/schemas";

// 긴 계약서는 1~3분 걸릴 수 있습니다 (Vercel 플랜별 최대 실행시간 확인)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const parsed = ContractRequestSchema.safeParse(await req.json());
    if (!parsed.success) throw new UserFacingError("입력값을 확인해주세요.");
    const body = parsed.data;
    if (!body.template.trim() && !body.revised.trim()) throw new UserFacingError("계약서를 하나 이상 올려주세요.");

    const apiKey = resolveApiKey(req);
    // 키가 없으면 데모 모드: 예시 NDA는 미리 만든 결과, 그 외에는 독소조항 패턴 사전으로 분석
    if (!apiKey) {
      const isSample = body.template.trim() === SAMPLE_NDA_TEMPLATE.trim() && body.revised.trim() === SAMPLE_NDA_REVISED.trim();
      return Response.json({ data: isSample ? DEMO_CONTRACT : mockContract(body), demo: true });
    }

    const result = await structuredCall({
      apiKey,
      system: CONTRACT_SYSTEM,
      user: contractUserPrompt(body),
      schema: ContractReviewSchema,
      effort: "high",
      maxTokens: 32000,
    });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}

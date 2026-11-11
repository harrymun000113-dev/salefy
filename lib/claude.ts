import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = process.env.SALEFY_MODEL || "claude-opus-5-5";

/** 사용자에게 그대로 보여줄 수 있는 오류 */
export class UserFacingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** 서버 환경변수 키를 우선 사용하고, 없으면 브라우저 설정에서 보낸 키를 사용 */
export function resolveApiKey(req: Request): string | null {
  return process.env.ANTHROPIC_API_KEY || req.headers.get("x-anthropic-key") || null;
}

export async function structuredCall<S extends z.ZodType>(opts: {
  apiKey: string;
  system: string;
  user: string;
  schema: S;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<{ data: z.infer<S>; usage: { input: number; output: number; model: string } }> {
  const client = new Anthropic({ apiKey: opts.apiKey, maxRetries: 3 });

  try {
    // 긴 계약서도 HTTP 타임아웃 없이 받도록 스트리밍으로 받고 최종 메시지만 사용
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
      // 안전 분류기가 거절하면 서버가 적합한 다른 모델로 자동 재시도
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") throw new UserFacingError("모델이 이 요청을 처리하지 않았습니다. 입력 내용을 확인해주세요.");
    if (msg.stop_reason === "max_tokens") throw new UserFacingError("결과가 너무 길어 잘렸습니다. 문서를 나눠서 시도해주세요.");
    if (msg.parsed_output == null) throw new UserFacingError("결과를 해석하지 못했습니다. 다시 시도해주세요.", 502);

    return {
      data: msg.parsed_output as z.infer<S>,
      usage: { input: msg.usage.input_tokens, output: msg.usage.output_tokens, model: msg.model },
    };
  } catch (e) {
    if (e instanceof UserFacingError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new UserFacingError("API 키가 유효하지 않습니다.", 401);
    if (e instanceof Anthropic.RateLimitError) throw new UserFacingError("요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.", 429);
    if (e instanceof Anthropic.BadRequestError) throw new UserFacingError(`요청 형식 오류: ${e.message}`, 400);
    if (e instanceof Anthropic.APIConnectionError) throw new UserFacingError("Claude API에 연결할 수 없습니다.", 503);
    if (e instanceof Anthropic.APIError) throw new UserFacingError(`Claude API 오류 (${e.status}): ${e.message}`, 502);
    throw e;
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof UserFacingError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
}

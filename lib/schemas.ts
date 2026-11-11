import { z } from "zod";

/* ---------------- 이메일 / 메신저 어시스턴트 ---------------- */

export const EmailAnalysisSchema = z.object({
  detected_language: z.string(),
  message_type: z.enum(["이메일", "메신저 스레드", "기타"]),
  one_line_summary: z.string().describe("한 줄 요약 (한국어)"),
  key_points: z.array(z.string()).describe("핵심 내용 3~6개 (한국어)"),
  counterpart_intent: z.string().describe("상대방이 실제로 원하는 것 / 숨은 의도 (한국어)"),
  urgency: z.enum(["긴급", "보통", "여유"]),
  tone_of_sender: z.string().describe("상대방 어조 (예: 정중함, 불만, 압박)"),
  action_items: z.array(
    z.object({
      task: z.string().describe("해야 할 일 (한국어)"),
      owner: z.enum(["우리", "상대방", "내부 협의"]),
      due: z.string().describe("기한. 명시되지 않았으면 '미정'"),
      priority: z.enum(["높음", "보통", "낮음"]),
    }),
  ),
  open_questions: z.array(z.string()).describe("답장 전에 내부에서 확인해야 할 사항 (한국어)"),
  risks: z.array(z.string()).describe("가격·납기·클레임 등 주의할 리스크. 없으면 빈 배열"),
  reply: z.object({
    subject: z.string(),
    body: z.string(),
    korean_translation: z.string().describe("답장 본문의 한국어 번역 (검토용)"),
  }),
});
export type EmailAnalysis = z.infer<typeof EmailAnalysisSchema>;

export const EmailRequestSchema = z.object({
  message: z.string().min(1).max(200_000),
  tone: z.enum(["formal", "friendly", "firm", "apologetic"]),
  language: z.string().max(40),
  signature: z.string().max(300).default(""),
  notes: z.string().max(5_000).default(""),
  demo: z.boolean().optional(),
});
export type EmailRequest = z.infer<typeof EmailRequestSchema>;

/* ---------------- 계약서 비교 & 독소조항 검토 ---------------- */

export const CATEGORIES = [
  "책임 제한", "면책/배상", "지급 조건", "납기/지체상금", "보증/하자", "지식재산권",
  "해지", "준거법/분쟁해결", "비밀유지", "경업/영업제한", "인코텀즈/소유권", "기타",
] as const;

export const ContractReviewSchema = z.object({
  contract_type: z.string().describe("예: NDA, SOW, Purchase Order, Distribution Agreement"),
  overall_risk: z.enum(["높음", "중간", "낮음"]),
  executive_summary: z.string().describe("결재권자용 3~5문장 요약 (한국어)"),
  findings: z
    .array(
      z.object({
        clause_ref: z.string().describe("조항 번호/제목 (예: '8. Limitation of Liability')"),
        change_type: z.enum(["수정", "추가", "삭제", "원문 자체 위험"]),
        risk_level: z.enum(["높음", "중간", "낮음"]),
        category: z.enum(CATEGORIES),
        original_text: z.string().describe("표준 템플릿의 해당 문구, 원문 그대로 (없으면 빈 문자열)"),
        revised_text: z.string().describe("바이어 수정본의 해당 문구, 원문 그대로 (삭제면 빈 문자열)"),
        why_risky: z.string().describe("공급자 입장에서 왜 불리한지 (한국어, 2~3문장)"),
        recommendation: z.string().describe("협상 전략 (한국어): 수용 / 조건부 수용 / 거절 및 이유"),
        counter_proposal: z.string().describe("바이어에게 제시할 영문 대안 문구 (수용 가능하면 빈 문자열)"),
      }),
    )
    .describe("위험도 높은 순으로 정렬"),
  missing_protections: z.array(z.string()).describe("공급자로서 있어야 하는데 빠진 보호 조항 (한국어)"),
  negotiation_email: z.string().describe("바이어에게 보낼 영문 협상 메일 초안"),
});
export type ContractReview = z.infer<typeof ContractReviewSchema>;

export const ContractRequestSchema = z.object({
  template: z.string().max(400_000).default(""),
  revised: z.string().max(400_000).default(""),
  context: z.string().max(2_000).default(""),
  demo: z.boolean().optional(),
});
export type ContractRequest = z.infer<typeof ContractRequestSchema>;

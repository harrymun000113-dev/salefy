/**
 * 데모 모드 엔진 (API 키 없이 동작)
 * - 이메일: 문장 단위 규칙으로 요약·요청사항·긴급도를 뽑고, 톤별 템플릿으로 답장 초안을 만듭니다.
 * - 계약서: 조항 diff 결과에 독소조항 패턴 사전을 적용해 위험도·대안 문구를 제시합니다.
 * 실제 서비스에서는 lib/claude.ts의 Claude 호출이 이 자리를 대신합니다.
 */
import { diffArrays } from "diff";
import { splitClauses } from "./diff";
import type { ContractRequest, ContractReview, EmailAnalysis, EmailRequest } from "./schemas";

/* ======================= 이메일 ======================= */

const REQUEST_RE = /\b(could you|can you|would you|please|we need|we'd need|we would need|need you to|asking for|request|kindly|let us know|confirm|send us|provide)\b|\?$/i;
const URGENT_RE = /\b(asap|urgent|urgently|immediately|today|eod|end of (the )?day|by (monday|tuesday|wednesday|thursday|friday)|deadline|end of next week|no later than|right away)\b/i;
const NEGATIVE_RE = /\b(complain|complaint|damaged|cracked|defect|broken|disappoint|unacceptable|annoyed|delay|late|claim|refund|credit note)\b/i;
const MONEY_RE = /(usd|eur|krw|\$|€|price|pricing|discount|cost|quotation|quote|payment|net \d+|t\/t|deposit|credit)/i;
const DATE_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d{1,2}\b|\b\d{1,2}(st|nd|rd|th)\b|\b(next|this) (week|month|friday|monday)\b|\bq[1-4]\b|\bby the \d+/i;

function sentences(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => !/^(from|to|cc|subject|date|sent):/i.test(l.trim()))
    .join("\n")
    .replace(/\[\d{1,2}:\d{2}\]\s*[^:\n]{1,40}:\s*/g, "\n") // 채팅 "[09:12] 이름: " 접두어 제거
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.replace(/[ \t]+/g, " ").replace(/^(hi|hello|dear|hey)\b[^,]{0,30},\s*/i, "").trim())
    .filter((s) => s.length > 12 && !/^(best|kind regards|regards|thanks|thank you|sincerely|cheers)\b/i.test(s));
}

function detectLanguage(t: string) {
  if (/[가-힣]/.test(t)) return "Korean";
  if (/[぀-ヿ]/.test(t)) return "Japanese";
  if (/[一-鿿]/.test(t)) return "Chinese";
  if (/[áéíóúñ¿¡]/i.test(t) && /\b(el|la|los|para|gracias)\b/i.test(t)) return "Spanish";
  if (/[äöüß]/i.test(t)) return "German";
  return "English";
}

const trim = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function senderName(text: string) {
  const from = text.match(/^from:\s*([^<\n]+)/im)?.[1]?.trim();
  if (from) return from.split(/\s+/)[0];
  const chat = text.match(/\]\s*([A-Z][a-z]+)/)?.[1]; // 채팅이면 첫 발화자
  return chat || "";
}

export function mockEmail(r: EmailRequest): EmailAnalysis {
  const text = r.message;
  const ss = sentences(text);
  const isChat = /\[\d{1,2}:\d{2}\]|^#\S+/m.test(text) || (text.match(/^\S.{0,30}:\s/gm)?.length ?? 0) >= 3 && !/^subject:/im.test(text);
  const requests = ss.filter((s) => REQUEST_RE.test(s));
  const urgent = ss.some((s) => URGENT_RE.test(s));
  const negative = ss.some((s) => NEGATIVE_RE.test(s));
  const money = ss.filter((s) => MONEY_RE.test(s));
  const keyPoints = Array.from(new Set([...requests, ...money, ...ss.filter((s) => DATE_RE.test(s))])).slice(0, 5);
  if (keyPoints.length < 3) keyPoints.push(...ss.filter((s) => !keyPoints.includes(s)).slice(0, 3 - keyPoints.length));
  const name = senderName(text);
  const subject = text.match(/^subject:\s*(.+)$/im)?.[1]?.trim();

  const risks: string[] = [];
  if (money.length) risks.push("가격·결제 조건이 언급됨 — 답장에서 확정 수치를 약속하기 전 내부 승인 필요");
  if (ss.some((s) => DATE_RE.test(s))) risks.push("기한·납기 관련 요구가 있음 — 생산/물류 일정 확인 후 회신 권장");
  if (negative) risks.push("불만·클레임 신호가 있음 — 책임 인정 표현은 원인 확인 전까지 피하기");

  const actionItems = requests.slice(0, 5).map((s) => ({
    task: `요청 검토 및 회신: “${trim(s, 90)}”`,
    owner: "우리" as const,
    due: s.match(DATE_RE)?.[0] ?? (urgent ? "빠른 회신" : "미정"),
    priority: (URGENT_RE.test(s) || MONEY_RE.test(s) ? "높음" : "보통") as "높음" | "보통",
  }));

  return {
    detected_language: detectLanguage(text),
    message_type: isChat ? "메신저 스레드" : ss.length ? "이메일" : "기타",
    one_line_summary: requests.length
      ? `상대방 요청 ${requests.length}건${money.length ? " (가격·조건 포함)" : ""}${urgent ? ", 회신 기한 임박" : ""}`
      : "정보 공유성 메시지 — 즉시 조치가 필요한 요청은 보이지 않음",
    key_points: keyPoints.map((s) => trim(s)),
    counterpart_intent: negative
      ? "문제 상황에 대한 신속한 해결(교체·보상)과 원인 설명을 원하는 것으로 보입니다."
      : money.length
        ? "가격·거래 조건에서 유리한 결과를 얻으려는 협상 의도가 보입니다."
        : "진행 상황 공유와 확인 회신을 기대하는 것으로 보입니다.",
    urgency: urgent ? "긴급" : requests.length ? "보통" : "여유",
    tone_of_sender: negative ? "불만·압박" : urgent ? "정중하지만 재촉" : "정중함",
    action_items: actionItems,
    open_questions: [
      ...(money.length ? ["제시 가능한 가격·결제 조건의 내부 한도는?"] : []),
      ...(ss.some((s) => DATE_RE.test(s)) ? ["요청 기한을 맞출 수 있는 생산·선적 일정인가?"] : []),
      ...(negative ? ["원인(운송/품질) 확인을 위한 사진·로트 번호 확보 여부"] : []),
    ],
    risks,
    reply: buildReply(r, { name, subject, requests, negative, urgent }),
  };
}

type ReplyCtx = { name: string; subject?: string; requests: string[]; negative: boolean; urgent: boolean };

const OPENERS: Record<EmailRequest["tone"], string> = {
  formal: "Thank you for your message. We have carefully reviewed your points and would like to respond as follows.",
  friendly: "Thanks a lot for reaching out — happy to help with this!",
  firm: "Thank you for your message. We have reviewed your requests and would like to be clear about our position.",
  apologetic: "Thank you for letting us know, and please accept our sincere apologies for the inconvenience this has caused.",
};
const CLOSERS: Record<EmailRequest["tone"], string> = {
  formal: "We look forward to your reply.",
  friendly: "Let me know if anything else comes up!",
  firm: "We hope you understand our position and look forward to moving forward on this basis.",
  apologetic: "We truly value our partnership and will do our best to resolve this as quickly as possible.",
};

function buildReply(r: EmailRequest, c: ReplyCtx): EmailAnalysis["reply"] {
  const greet = c.name ? `Hi ${c.name},` : "Hello,";
  const points = c.requests.slice(0, 4).map((q, i) => `${i + 1}. Regarding "${trim(q, 80)}" — [our answer / confirm internally].`);
  const notes = r.notes.trim() ? `\nAs discussed internally: [${r.notes.trim()}]\n` : "";
  const body = [
    greet,
    "",
    OPENERS[r.tone],
    "",
    ...(points.length ? points : ["[Main response to the message]"]),
    notes,
    c.urgent ? "We understand the timeline is tight and will come back to you with a full answer by [date]." : "We will follow up with any further details by [date].",
    "",
    CLOSERS[r.tone],
    "",
    "Best regards,",
    r.signature.trim() || "[Your Name]",
  ].join("\n").replace(/\n{3,}/g, "\n\n");

  const ko = [
    c.name ? `${c.name}님 안녕하세요,` : "안녕하세요,",
    "",
    { formal: "메시지 감사합니다. 말씀하신 내용을 검토하여 아래와 같이 회신드립니다.", friendly: "연락 주셔서 감사합니다. 기꺼이 도와드리겠습니다!", firm: "메시지 감사합니다. 요청 사항을 검토했으며 저희 입장을 명확히 말씀드립니다.", apologetic: "알려주셔서 감사드리며, 불편을 드린 점 진심으로 사과드립니다." }[r.tone],
    "",
    ...(points.length ? c.requests.slice(0, 4).map((_, i) => `${i + 1}. 요청 ${i + 1}에 대해 — [답변 / 내부 확인]`) : ["[주요 회신 내용]"]),
    "",
    "[날짜]까지 자세한 내용을 회신드리겠습니다.",
    "",
    "감사합니다.",
  ].join("\n");

  return {
    subject: c.subject ? (c.subject.toLowerCase().startsWith("re:") ? c.subject : `RE: ${c.subject}`) : "RE: Your message",
    body: r.language === "English" ? body : `[${r.language} 답장은 정식 버전에서 생성됩니다 — 데모는 영문 초안]\n\n${body}`,
    korean_translation: ko,
  };
}

/* ======================= 계약서 ======================= */

type Rule = {
  re: RegExp;
  category: ContractReview["findings"][number]["category"];
  risk: "높음" | "중간" | "낮음";
  why: string;
  rec: string;
  counter: string;
};

// 공급자(수출자) 관점의 대표적인 독소조항 패턴
const RULES: Rule[] = [
  { re: /consequential|indirect damages|loss of profit|lost profits/i, category: "책임 제한", risk: "높음",
    why: "간접·결과적 손해(일실이익 등)까지 배상 범위에 포함되어 배상액을 예측할 수 없습니다.",
    rec: "거절. 간접손해 배제 문구를 상호 적용으로 추가 요청.",
    counter: "Neither party shall be liable for any indirect, incidental, special or consequential damages, including loss of profits." },
  { re: /indemnif|hold harmless/i, category: "면책/배상", risk: "높음",
    why: "공급자에게 포괄적인 면책·배상 의무를 지웁니다. 상대방 과실로 인한 손해까지 떠안을 수 있습니다.",
    rec: "조건부 수용. 배상 범위를 '공급자의 귀책 사유'로 한정하고 상호 적용 요청.",
    counter: "Each party shall indemnify the other only for losses directly caused by its own breach or negligence, subject to the limitation of liability in this Agreement." },
  { re: /unlimited liability|without limit|any and all (losses|damages)/i, category: "책임 제한", risk: "높음",
    why: "책임 상한이 없어 계약 금액을 초과하는 배상 책임이 발생할 수 있습니다.",
    rec: "거절. 책임 상한(계약금액 또는 고정 금액) 명시 요청.",
    counter: "Each party's aggregate liability under this Agreement shall not exceed the total amount paid under the relevant Purchase Order." },
  { re: /liquidated damages|penalty of|per day of delay|per week of delay/i, category: "납기/지체상금", risk: "높음",
    why: "지체상금이 정해져 있으면 작은 지연에도 금전 책임이 자동 발생합니다. 상한이 없으면 위험이 큽니다.",
    rec: "조건부 수용. 일 0.1% 이하, 총액 상한 5~10%, 불가항력 면책 명시 요청.",
    counter: "Liquidated damages for delay shall not exceed 0.1% of the delayed value per day, capped at 5% of the total order value, and shall be the Buyer's sole remedy for delay." },
  { re: /net\s?(9\d|1[2-8]\d)|(90|120|180) days (after|from) (invoice|receipt)|pay[- ]when[- ]paid/i, category: "지급 조건", risk: "높음",
    why: "대금 회수 기간이 길어 현금흐름과 미수금 리스크가 커집니다.",
    rec: "Net 30~60으로 단축하거나 선금(T/T 30%)·신용장 조건 요청.",
    counter: "Payment shall be made by T/T, 30% in advance and the balance within thirty (30) days from the B/L date." },
  { re: /terminate[^.]*(at any time|for convenience|immediate effect|without cause)/i, category: "해지", risk: "중간",
    why: "상대방이 이유 없이 즉시 해지할 수 있어, 이미 투입한 생산·자재 비용을 회수하지 못할 수 있습니다.",
    rec: "상호 해지권 + 사전 통지 기간(30~90일) + 진행분 대금 보상 조항 요청.",
    counter: "Either party may terminate this Agreement upon ninety (90) days' prior written notice. The Buyer shall pay for all products delivered and work in progress up to the termination date." },
  { re: /sole property of the buyer|assign[^.]*intellectual property|improvements[^.]*property|derivative works/i, category: "지식재산권", risk: "높음",
    why: "공급자가 개발한 개선 기술·노하우까지 상대방 소유가 될 수 있습니다.",
    rec: "거절. 각자 기존·독자 개발 IP 보유 원칙 유지, 공동개발은 별도 계약.",
    counter: "Each party retains all rights in its pre-existing and independently developed intellectual property. No license or assignment is granted except as expressly agreed in writing." },
  { re: /laws of the state of|courts (located )?in|exclusive jurisdiction|governed by the laws of (?!the republic of korea)/i, category: "준거법/분쟁해결", risk: "중간",
    why: "외국 법원 관할이면 분쟁 시 소송 비용·시간 부담이 크고, 판결의 해외 집행도 어렵습니다.",
    rec: "한국법·대한상사중재원, 또는 제3국 중재(SIAC 등)로 절충 제안.",
    counter: "Any dispute arising out of this Agreement shall be finally settled by arbitration under the SIAC Rules in Singapore, conducted in English." },
  { re: /survive indefinitely|perpetual|in perpetuity/i, category: "비밀유지", risk: "중간",
    why: "의무 기간이 무기한이라 관리 부담이 계속되고, 상호 계약이라면 비대칭일 수 있습니다.",
    rec: "존속 기간을 3~5년으로 한정 (영업비밀만 예외).",
    counter: "Confidentiality obligations shall survive for five (5) years after termination; obligations regarding trade secrets survive for so long as they remain trade secrets." },
  { re: /shall not (sell|solicit|compete)|non-?solicit|non-?compet|exclusiv/i, category: "경업/영업제한", risk: "높음",
    why: "공급자의 판매 대상·지역을 제한해 다른 고객과의 거래 기회를 잃을 수 있습니다.",
    rec: "삭제 요청. 필요하면 범위(지역·제품·기간)를 좁히고 최소 구매량과 연동.",
    counter: "" },
  { re: /warrant[^.]*(\b(3[6-9]|[4-9]\d)\b months|three|four|five|[3-9] years)/i, category: "보증/하자", risk: "중간",
    why: "업계 통상(12~24개월)보다 긴 보증 기간은 사후 비용 부담을 늘립니다.",
    rec: "보증 기간 12~18개월(선적일 기준)로 제안.",
    counter: "The Seller warrants the products to be free from defects in material and workmanship for twelve (12) months from the B/L date." },
  { re: /audit[^.]*(any time|without notice|at all times)/i, category: "기타", risk: "중간",
    why: "사전 통지 없는 감사권은 영업 비밀 노출과 업무 부담을 초래합니다.",
    rec: "연 1회, 30일 전 통지, 영업시간 내, 상대방 비용 부담 조건 요청.",
    counter: "The Buyer may audit relevant records once per year upon thirty (30) days' prior written notice, during normal business hours and at its own cost." },
  { re: /most favou?red|lowest price/i, category: "지급 조건", risk: "중간",
    why: "최혜국 가격 조항은 다른 고객과의 가격 협상력을 떨어뜨립니다.",
    rec: "삭제 요청, 또는 동일 물량·조건일 때만 적용으로 한정.",
    counter: "" },
  { re: /title and risk|risk of loss|title shall pass/i, category: "인코텀즈/소유권", risk: "낮음",
    why: "소유권·위험 이전 시점이 인코텀즈와 다르면 운송 중 사고 책임이 불명확해집니다.",
    rec: "인코텀즈 2020 규칙과 일치하도록 문구 정리.",
    counter: "Title and risk of loss shall pass to the Buyer in accordance with the agreed Incoterms® 2020 rule." },
];

const clauseRef = (s: string) => {
  const m = s.match(/^((\d+(\.\d+)*\.?|article \d+|section \d+|제\s*\d+\s*조)\s*[^.:]{0,40})/i);
  return (m?.[1] ?? s.slice(0, 40)).replace(/[.:]\s*$/, "").trim();
};
const sameRef = (a: string, b: string) => clauseRef(a).split(/\s/)[0] === clauseRef(b).split(/\s/)[0];

export function mockContract(r: ContractRequest): ContractReview {
  const tpl = r.template.trim() ? splitClauses(r.template) : [];
  const rev = r.revised.trim() ? splitClauses(r.revised) : splitClauses(r.template);
  const solo = !tpl.length || !r.revised.trim();

  // 검토 대상: (원문, 수정본, 변경유형)
  const targets: { o: string; n: string; type: ContractReview["findings"][number]["change_type"] }[] = [];
  if (solo) {
    rev.forEach((n) => targets.push({ o: "", n, type: "원문 자체 위험" }));
  } else {
    const chunks = diffArrays(tpl, rev);
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i], next = chunks[i + 1];
      if (c.removed && next?.added) {
        const used = new Set<number>();
        for (const o of c.value) {
          const j = next.value.findIndex((n, k) => !used.has(k) && sameRef(o, n));
          if (j >= 0) { used.add(j); targets.push({ o, n: next.value[j], type: "수정" }); }
          else targets.push({ o, n: "", type: "삭제" });
        }
        next.value.forEach((n, k) => !used.has(k) && targets.push({ o: "", n, type: "추가" }));
        i++;
      } else if (c.added) c.value.forEach((n) => targets.push({ o: "", n, type: "추가" }));
      else if (c.removed) c.value.forEach((o) => targets.push({ o, n: "", type: "삭제" }));
      else c.value.forEach((n) => targets.push({ o: n, n, type: "원문 자체 위험" }));
    }
  }

  const findings: ContractReview["findings"] = [];
  for (const t of targets) {
    const text = t.n || t.o;
    const hit = RULES.find((rule) => rule.re.test(t.n)) ;
    if (hit) {
      findings.push({
        clause_ref: clauseRef(text), change_type: t.type, risk_level: hit.risk, category: hit.category,
        original_text: t.type === "원문 자체 위험" && !solo ? t.o : t.o, revised_text: t.n,
        why_risky: hit.why, recommendation: hit.rec, counter_proposal: hit.counter,
      });
    } else if (t.type === "삭제") {
      findings.push({
        clause_ref: clauseRef(text), change_type: "삭제", risk_level: "중간", category: "기타",
        original_text: t.o, revised_text: "",
        why_risky: "표준 템플릿에 있던 조항이 삭제되었습니다. 우리 측 보호 장치가 빠졌을 수 있습니다.",
        recommendation: "삭제 사유를 확인하고, 보호 조항이면 원복 요청.", counter_proposal: t.o,
      });
    } else if (t.type === "수정" || t.type === "추가") {
      findings.push({
        clause_ref: clauseRef(text), change_type: t.type, risk_level: "낮음", category: "기타",
        original_text: t.o, revised_text: t.n,
        why_risky: "알려진 독소조항 패턴은 없지만 문구가 바뀌었습니다. 의미 변화가 없는지 확인하세요.",
        recommendation: "변경 의도 확인 후 수용 여부 결정.", counter_proposal: "",
      });
    }
  }

  const order = { 높음: 0, 중간: 1, 낮음: 2 } as const;
  findings.sort((a, b) => order[a.risk_level] - order[b.risk_level]);
  const high = findings.filter((f) => f.risk_level === "높음").length;
  const mid = findings.filter((f) => f.risk_level === "중간").length;
  const all = (rev.join(" ") + " ").toLowerCase();

  const missing = [
    !/force majeure|불가항력/.test(all) && "불가항력(Force Majeure) 조항",
    !/limit(ation)? of liability|shall not exceed|책임.*한도/.test(all) && "책임 상한(Limitation of Liability) 조항",
    /confidential/.test(all) && !/publicly available|public domain|independently developed/.test(all) && "비밀정보의 예외 조항 (공지 정보, 독자 개발 등)",
    /confidential/.test(all) && !/return or destroy|destroy/.test(all) && "계약 종료 시 비밀정보 반환·파기 조항",
  ].filter((x): x is string => !!x);

  const type = /non-?disclosure|confidentiality agreement/i.test(all) ? "NDA (비밀유지계약)"
    : /purchase order/i.test(all) ? "Purchase Order" : /statement of work|\bsow\b/i.test(all) ? "SOW"
    : /distribut/i.test(all) ? "Distribution Agreement" : /supply/i.test(all) ? "Supply Agreement" : "일반 계약서";

  const asks = findings.filter((f) => f.risk_level !== "낮음" && f.counter_proposal).slice(0, 5);
  return {
    contract_type: type,
    overall_risk: high >= 2 ? "높음" : high || mid >= 2 ? "중간" : "낮음",
    executive_summary: solo
      ? `단독 검토 모드: ${rev.length}개 조항 중 고위험 ${high}건, 중간 ${mid}건이 감지되었습니다. ${high ? "서명 전 고위험 조항의 수정 협상이 필요합니다." : "치명적인 패턴은 보이지 않지만 세부 조건을 확인하세요."}`
      : `표준 템플릿 대비 ${targets.filter((t) => t.type !== "원문 자체 위험").length}개 조항이 바뀌었고, 그중 고위험 ${high}건, 중간 ${mid}건이 감지되었습니다. ${high ? "공급자에게 불리한 변경이 포함되어 있어 서명 전 원복 또는 수정 협상이 필요합니다." : "큰 위험 패턴은 없지만 바뀐 문구의 의도를 확인하세요."}`,
    findings,
    missing_protections: missing,
    negotiation_email: [
      "Dear [Buyer Name],",
      "",
      "Thank you for sending the revised draft. We have reviewed it carefully and would like to propose the following adjustments to keep the agreement balanced:",
      "",
      ...(asks.length ? asks.map((f, i) => `${i + 1}. ${f.clause_ref}: ${f.counter_proposal}`) : ["[Requested changes]"]),
      "",
      "We have attached a marked-up version for your review and would be happy to arrange a short call to finalize the document.",
      "",
      "Best regards,",
      "[Your Name]",
    ].join("\n"),
  };
}

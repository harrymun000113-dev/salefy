import type { ContractReview, EmailAnalysis } from "./schemas";

// API 키 없이 화면을 둘러볼 수 있도록 예시 입력에 대한 미리 만들어 둔 결과입니다.

export const DEMO_EMAIL: EmailAnalysis = {
  detected_language: "English",
  message_type: "이메일",
  one_line_summary: "바이어가 SX-200 단가 6% 인하(USD 17.30)를 조건으로 Q1 3,000개 PO를 제시",
  key_points: [
    "현재 견적 USD 18.40이 베트남 경쟁사 대비 약 6% 높다고 주장",
    "USD 17.30 수준이면 Q1 3,000개 PO 확정, Q2 재주문 가능성 언급",
    "2월 28일까지 LA 창고 도착 필요 — 리드타임 8주로는 빠듯함",
    "인코텀즈를 FOB Busan → CIF Long Beach로 변경 요청",
    "결제 조건을 T/T 30% 선금 → Net 60으로 변경 요청",
  ],
  counterpart_intent:
    "경쟁사 견적을 지렛대로 가격을 낮추려는 전형적인 협상. 실제로는 단가보다 납기와 현금흐름(Net 60)이 더 급한 것으로 보임.",
  urgency: "긴급",
  tone_of_sender: "정중하지만 압박 (다음 주 말 공급사 확정 마감 제시)",
  action_items: [
    { task: "SX-200 최저 가능 단가 및 수량별 가격 구간 내부 확인", owner: "우리", due: "이번 주", priority: "높음" },
    { task: "2/28 LA 도착 가능한 생산·선적 일정 확인 (물류팀)", owner: "우리", due: "이번 주", priority: "높음" },
    { task: "CIF Long Beach 해상운임·보험료 견적 받기", owner: "우리", due: "답장 전", priority: "보통" },
    { task: "Net 60 수용 여부 및 신용보험 적용 가능 여부 재무팀 협의", owner: "내부 협의", due: "답장 전", priority: "높음" },
    { task: "공급사 최종 확정", owner: "상대방", due: "다음 주 말", priority: "보통" },
  ],
  open_questions: [
    "3,000개 기준 마진을 지키면서 줄 수 있는 최대 할인 폭은?",
    "Northstar의 신용도 — Net 60을 줘도 되는 거래처인가?",
    "Q2 재주문을 조건으로 한 단계별 가격 제시가 가능한가?",
  ],
  risks: [
    "CIF 전환 시 운임 상승분이 단가 인하와 겹쳐 마진이 이중으로 줄어듦",
    "Net 60 + 선금 없음 → 첫 거래 미수금 리스크",
    "무리한 납기 약속 시 지체 클레임 가능성",
  ],
  reply: {
    subject: "RE: Q1 Order – Pricing & Lead Time",
    body: `Hi Michael,

Thank you for the quick feedback and for considering us for your Q1 program.

We understand the price pressure and would like to find a way to make this work. Based on a confirmed PO of 3,000 units, we can offer USD [confirm price] per unit for SX-200. If you are able to commit to the Q2 repeat order at the same time, we would be glad to discuss further volume pricing.

On the other points:
• Delivery: We are checking with our production team whether we can meet a February 28 arrival in LA, and will confirm by [date].
• Incoterms: CIF Long Beach is possible; we will send an updated quotation reflecting freight and insurance.
• Payment: Net 60 is difficult for a first order. Could we consider [alternative terms] for the initial shipment and revisit after the first order?

We know your deadline is the end of next week, so we will come back to you with a full revised proposal by [date].

Best regards,
[Your Name]`,
    korean_translation: `Michael님 안녕하세요,

빠른 피드백과 Q1 프로그램에 저희를 고려해주셔서 감사합니다.

가격 부담은 충분히 이해하며, 성사될 수 있는 방안을 찾고 싶습니다. 3,000개 PO 확정 기준으로 SX-200 단가를 USD [가격 확인]에 제안드릴 수 있습니다. Q2 재주문도 함께 확정해주실 수 있다면 추가 물량 할인도 논의하겠습니다.

그 외 사항:
• 납기: 2월 28일 LA 도착이 가능한지 생산팀과 확인 중이며 [날짜]까지 확정해드리겠습니다.
• 인코텀즈: CIF Long Beach 가능하며, 운임·보험료를 반영한 수정 견적을 보내드리겠습니다.
• 결제: 첫 주문에 Net 60은 어렵습니다. 첫 선적은 [대안 조건]으로 하고 이후 재검토하는 것은 어떨까요?

다음 주 말이 마감이신 만큼 [날짜]까지 전체 수정 제안을 드리겠습니다.

감사합니다.
[이름]`,
  },
};

export const DEMO_CONTRACT: ContractReview = {
  contract_type: "Mutual NDA (상호 비밀유지계약)",
  overall_risk: "높음",
  executive_summary:
    "바이어 수정본은 '상호' NDA의 형식을 유지하면서 실질적인 의무와 책임을 공급자에게만 지우고 있습니다. 특히 무제한 배상 책임(간접손해 포함), 개선 발명의 바이어 귀속, 미국 델라웨어 법원 전속관할, 2년간의 판매 제한 조항은 수용하기 어렵습니다. 서명 전 최소 4개 조항의 원복 또는 수정이 필요합니다.",
  findings: [
    {
      clause_ref: "6. Remedies",
      change_type: "수정",
      risk_level: "높음",
      category: "면책/배상",
      original_text: "Each party's total liability arising out of this Agreement shall not exceed USD 100,000, except in cases of willful misconduct.",
      revised_text: "The Supplier shall indemnify and hold harmless the Buyer from any and all losses, including indirect and consequential damages, arising from any breach of this Agreement.",
      why_risky: "책임 상한(USD 100,000)이 삭제되고 공급자만 일방적으로 배상하는 구조로 바뀌었습니다. 간접·결과적 손해까지 포함되어 이론상 배상액에 한도가 없습니다.",
      recommendation: "거절. 상호 책임 구조와 책임 상한을 원복하고, 간접손해 배제 문구를 추가 요청.",
      counter_proposal: "Neither party shall be liable for any indirect, incidental or consequential damages. Each party's aggregate liability arising out of this Agreement shall not exceed USD 100,000, except in cases of willful misconduct.",
    },
    {
      clause_ref: "5. Intellectual Property",
      change_type: "수정",
      risk_level: "높음",
      category: "지식재산권",
      original_text: "No license or ownership right in any intellectual property is granted or transferred under this Agreement. Each party retains all rights in its pre-existing intellectual property.",
      revised_text: "Any improvements, feedback, or derivative works relating to the Buyer's products that are developed by the Supplier during the term of this Agreement shall be the sole property of the Buyer.",
      why_risky: "공급자가 자체 개발한 공정·설계 개선까지 바이어 소유가 될 수 있습니다. NDA 단계에서 IP를 넘기는 것은 업계 관행에 어긋나며 핵심 기술 유출로 이어질 수 있습니다.",
      recommendation: "거절. IP 조항은 원문으로 원복하고, 공동 개발이 필요하면 별도 개발계약에서 논의하자고 제안.",
      counter_proposal: "No license or ownership right in any intellectual property is granted or transferred under this Agreement. Each party retains all rights in its pre-existing and independently developed intellectual property.",
    },
    {
      clause_ref: "8. Governing Law",
      change_type: "수정",
      risk_level: "높음",
      category: "준거법/분쟁해결",
      original_text: "This Agreement shall be governed by the laws of the Republic of Korea. Any dispute shall be finally settled by arbitration at the Korean Commercial Arbitration Board in Seoul.",
      revised_text: "This Agreement shall be governed by the laws of the State of Delaware, USA. Any dispute shall be resolved exclusively in the state or federal courts located in Wilmington, Delaware.",
      why_risky: "분쟁 시 미국 법원에서 소송해야 하므로 비용과 시간 부담이 매우 큽니다. 소송은 중재보다 해외 집행도 어렵습니다.",
      recommendation: "조건부 수용. 한국법이 어렵다면 제3국 중재(싱가포르 SIAC 등)로 절충 제안.",
      counter_proposal: "Any dispute arising out of this Agreement shall be finally settled by arbitration under the SIAC Rules in Singapore, conducted in English.",
    },
    {
      clause_ref: "9. Non-Solicitation",
      change_type: "추가",
      risk_level: "높음",
      category: "경업/영업제한",
      original_text: "",
      revised_text: "During the term and for two (2) years thereafter, the Supplier shall not sell similar products to any customer introduced by the Buyer.",
      why_risky: "NDA에 판매 제한을 끼워 넣은 조항입니다. '소개받은 고객'의 범위가 모호해 기존 고객과의 거래까지 제한될 수 있습니다.",
      recommendation: "삭제 요청. NDA 목적과 무관하며, 필요하면 유통계약에서 따로 협의.",
      counter_proposal: "",
    },
    {
      clause_ref: "7. Termination",
      change_type: "수정",
      risk_level: "중간",
      category: "해지",
      original_text: "Either party may terminate this Agreement upon thirty (30) days' written notice.",
      revised_text: "The Buyer may terminate this Agreement at any time with immediate effect.",
      why_risky: "해지권이 바이어에게만 있습니다. 공급자는 계약에서 빠져나올 수 없는데 의무(무기한 비밀유지 등)는 계속 남습니다.",
      recommendation: "상호 해지권 원복 요청.",
      counter_proposal: "Either party may terminate this Agreement upon thirty (30) days' written notice.",
    },
    {
      clause_ref: "4. Term",
      change_type: "수정",
      risk_level: "중간",
      category: "비밀유지",
      original_text: "This Agreement shall remain in effect for two (2) years from the Effective Date. Confidentiality obligations survive for three (3) years after termination.",
      revised_text: "This Agreement shall remain in effect for five (5) years from the Effective Date. Confidentiality obligations of the Supplier survive indefinitely.",
      why_risky: "공급자의 비밀유지 의무만 무기한으로 바뀌었습니다. 상호 계약인데 의무가 비대칭입니다.",
      recommendation: "조건부 수용. 기간 3년, 비밀유지 존속 5년으로 상호 동일하게 제안 (영업비밀만 예외적으로 장기 허용).",
      counter_proposal: "This Agreement shall remain in effect for three (3) years from the Effective Date. Each party's confidentiality obligations survive for five (5) years after termination; obligations regarding trade secrets survive for so long as they remain trade secrets.",
    },
    {
      clause_ref: "1. Purpose",
      change_type: "수정",
      risk_level: "낮음",
      category: "비밀유지",
      original_text: "The parties wish to exchange Confidential Information solely for the purpose of evaluating a potential supply relationship (the \"Purpose\").",
      revised_text: "The parties wish to exchange Confidential Information for the purpose of evaluating and performing a potential supply relationship and any related business (the \"Purpose\").",
      why_risky: "'solely' 삭제와 'any related business' 추가로 정보 사용 범위가 넓어졌습니다. 우리 정보가 다른 사업에 쓰일 여지가 생깁니다.",
      recommendation: "'any related business' 삭제 요청. 'performing'은 수용 가능.",
      counter_proposal: "The parties wish to exchange Confidential Information solely for the purpose of evaluating and performing a potential supply relationship between the parties (the \"Purpose\").",
    },
  ],
  missing_protections: [
    "비밀정보의 예외 조항 (공지의 정보, 독자 개발, 제3자로부터 적법 취득 등)",
    "계약 종료 시 비밀정보 반환·파기 조항",
    "법령·법원 명령에 따른 공개 허용 조항",
  ],
  negotiation_email: `Dear [Buyer Name],

Thank you for sending your comments on the Mutual NDA. We have reviewed the revised draft and are keen to move forward quickly.

To keep the agreement balanced and mutual, we would like to propose the following:

1. Liability (Sec. 6): We propose restoring a mutual liability cap of USD 100,000 and excluding indirect and consequential damages for both parties.
2. Intellectual Property (Sec. 5): As this is an NDA, we suggest each party retains its own IP; any joint development can be addressed in a separate development agreement.
3. Governing Law (Sec. 8): As a neutral option, we propose arbitration under the SIAC Rules in Singapore.
4. Non-Solicitation (Sec. 9): We kindly ask to remove this clause, as it falls outside the scope of an NDA.
5. Term & Termination (Sec. 4, 7): We propose mutual obligations — a 3-year term, 5-year confidentiality survival, and a mutual 30-day termination right.

We have attached a marked-up version for your review. We are happy to schedule a short call if that would help finalize the document.

Best regards,
[Your Name]`,
};

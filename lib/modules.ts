// 기능 모듈 목록. 새 기능은 app/<경로>/page.tsx를 만들고 여기에 href를 붙이면 홈과 메뉴에 노출됩니다.
export type ModuleInfo = {
  key: string;
  title: string;
  desc: string;
  href?: string; // 없으면 "준비 중"
  tags: string[];
};

export const MODULES: ModuleInfo[] = [
  {
    key: "email",
    title: "이메일 / 메신저 어시스턴트",
    desc: "영문 이메일·슬랙 스레드를 붙여넣으면 한국어 요약, 액션 아이템, 원하는 톤의 답장 초안까지.",
    href: "/email",
    tags: ["요약", "액션 아이템", "8개 언어 답장"],
  },
  {
    key: "contract",
    title: "계약서 비교 & 독소조항 검토",
    desc: "표준 템플릿과 바이어 수정본을 올리면 바뀐 조항을 표시하고, 공급자에게 불리한 조항과 대안 문구를 제시합니다.",
    href: "/contract",
    tags: ["PDF · DOCX", "Redline", "대안 문구"],
  },
  { key: "buyer", title: "바이어 리서치", desc: "회사·담당자 정보를 요약하고 첫 미팅 브리핑을 만듭니다.", tags: ["준비 중"] },
  { key: "quote", title: "견적서 / PI 생성", desc: "인코텀즈·환율을 반영한 견적서와 Proforma Invoice 초안.", tags: ["준비 중"] },
  { key: "meeting", title: "미팅 노트 → 후속 메일", desc: "회의록에서 합의사항을 정리하고 팔로업 메일을 생성합니다.", tags: ["준비 중"] },
];

"use client";

import { AlertTriangle, CircleHelp, Download, Languages, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/header";
import { postJson, useSettings } from "@/components/settings";
import {
  Badge, Button, Card, CardHeader, CopyButton, Input, Kbd, Label, Note, riskTone, Segmented, Select, Stat, Tabs, Textarea,
} from "@/components/ui";
import { SAMPLE_EMAIL, SAMPLE_SLACK } from "@/lib/samples";
import type { EmailAnalysis, EmailRequest } from "@/lib/schemas";

const TONES: { value: EmailRequest["tone"]; label: string }[] = [
  { value: "formal", label: "정중" },
  { value: "friendly", label: "친근" },
  { value: "firm", label: "단호" },
  { value: "apologetic", label: "사과" },
];
const LANGS = ["English", "Chinese (Simplified)", "Japanese", "Spanish", "German", "French", "Vietnamese", "Korean"].map((l) => ({ value: l, label: l }));

export default function EmailPage() {
  const { apiKey } = useSettings();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<EmailRequest["tone"]>("formal");
  const [language, setLanguage] = useState("English");
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EmailAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => { try { setSignature(localStorage.getItem("salefy.signature") ?? ""); } catch {} }, []);


  async function run() {
    if (!message.trim() || loading) return;
    setLoading(true); setError("");
    try { localStorage.setItem("salefy.signature", signature); } catch {}
    try {
      const res = await postJson<EmailAnalysis>("/api/email", { message, tone, language, signature, notes }, apiKey);
      setResult(res.data); setIsDemo(!!res.demo);
      requestAnimationFrame(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="이메일 / 메신저 어시스턴트"
        desc="받은 메일이나 슬랙·팀즈·위챗 스레드를 원문 그대로 붙여넣으세요. 핵심 요약, 해야 할 일, 답장 초안을 만들어 드립니다."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* 입력 */}
          <Card>
            <CardHeader
              title="받은 메시지"
              desc="원문 그대로 붙여넣기"
              right={
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setMessage(SAMPLE_EMAIL)}>예시: 바이어 메일</Button>
                  <Button size="sm" variant="ghost" onClick={() => setMessage(SAMPLE_SLACK)}>예시: 슬랙</Button>
                </div>
              }
            />
            <div className="p-5">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && run()}
                rows={16}
                placeholder={"From: ...\nSubject: ...\n\nHi team, ..."}
                className="min-h-[340px] font-mono text-[13px]"
              />
              <div className="mt-2 flex justify-between text-xs text-fg-subtle">
                <span>{message.length.toLocaleString()}자</span>
                <span><Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> 로 실행</span>
              </div>
            </div>
          </Card>

          {/* 옵션 */}
          <Card className="h-fit">
            <CardHeader title="답장 설정" />
            <div className="space-y-5 p-5">
              <div>
                <Label>톤</Label>
                <Segmented value={tone} onChange={setTone} options={TONES} />
              </div>
              <div>
                <Label>답장 언어</Label>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGS} />
              </div>
              <div>
                <Label hint="자동 저장">서명</Label>
                <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Harry Mun / Overseas Sales" />
              </div>
              <div>
                <Label hint="선택">답장에 담을 내용</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                  placeholder="예) 단가 3% 인하 불가, 대신 MOQ 500개로 조정 가능. 납기 6주." />
              </div>
              <Button variant="primary" className="w-full" onClick={run} loading={loading} disabled={!message.trim()}>
                {!loading && <Sparkles className="size-4" />}
                {loading ? "분석 중…" : "분석하고 답장 만들기"}
              </Button>
              <p className="text-center text-xs text-fg-subtle">데모 모드 · 규칙 기반 엔진으로 동작하며 외부 API를 호출하지 않습니다</p>
            </div>
          </Card>
        </div>

        {error && <Note tone="red" title="실행하지 못했습니다">{error}</Note>}
        {loading && <ResultSkeleton />}
        {result && !loading && <Result r={result} demo={isDemo} />}
      </div>
    </>
  );
}

function Result({ r, demo }: { r: EmailAnalysis; demo: boolean }) {
  const [tab, setTab] = useState<"summary" | "actions" | "reply">("summary");
  const [subject, setSubject] = useState(r.reply.subject);
  const [body, setBody] = useState(r.reply.body);
  const [showKo, setShowKo] = useState(false);
  useEffect(() => { setSubject(r.reply.subject); setBody(r.reply.body); }, [r]);

  const download = () => {
    const blob = new Blob([`Subject: ${subject}\n\n${body}`], { type: "text/plain;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "reply.txt" });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div id="result" className="scroll-mt-28 space-y-4">
      {demo && <Note tone="blue"><b>데모 모드</b> 결과입니다. 포트폴리오 버전은 규칙 기반 엔진으로 분석하며, 정식 버전에서는 같은 화면에 Claude API 분석 결과가 표시됩니다.</Note>}

      <Card>
        <div className="border-b border-border px-5 py-4">
          <div className="font-mono text-[11px] tracking-wide text-fg-subtle uppercase">한 줄 요약</div>
          <p className="mt-1 text-lg font-semibold tracking-tight">{r.one_line_summary}</p>
        </div>
        <div className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          <Stat label="긴급도" value={<Badge tone={riskTone(r.urgency)} className="h-6 px-2.5 text-sm">{r.urgency}</Badge>} />
          <Stat label="원문 언어" value={r.detected_language} />
          <Stat label="유형" value={r.message_type} />
          <Stat label="할 일" value={`${r.action_items.length}건`} />
        </div>
      </Card>

      <Card>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "summary", label: "요약" },
            { value: "actions", label: "액션 아이템", count: r.action_items.length },
            { value: "reply", label: "답장 초안" },
          ]}
        />

        {tab === "summary" && (
          <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <section>
                <h4 className="mb-2 text-[13px] font-semibold">핵심 내용</h4>
                <ul className="space-y-2">
                  {r.key_points.map((p, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="mt-0.5 font-mono text-xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>{p}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border p-4">
                  <div className="text-xs text-fg-muted">상대방 의도</div>
                  <p className="mt-1 text-sm leading-relaxed">{r.counterpart_intent}</p>
                </div>
                <div className="rounded-md border border-border p-4">
                  <div className="text-xs text-fg-muted">상대방 어조</div>
                  <p className="mt-1 text-sm leading-relaxed">{r.tone_of_sender}</p>
                </div>
              </section>
            </div>
            <div className="space-y-3">
              {r.risks.length > 0 && (
                <Note tone="amber" title={<span className="flex items-center gap-1.5"><AlertTriangle className="size-3.5" /> 주의할 리스크</span>}>
                  <ul className="list-disc space-y-1 pl-4">{r.risks.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </Note>
              )}
              {r.open_questions.length > 0 && (
                <Note tone="blue" title={<span className="flex items-center gap-1.5"><CircleHelp className="size-3.5" /> 답장 전 내부 확인</span>}>
                  <ul className="list-disc space-y-1 pl-4">{r.open_questions.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </Note>
              )}
            </div>
          </div>
        )}

        {tab === "actions" && (
          <div className="overflow-x-auto">
            {r.action_items.length === 0 ? (
              <p className="p-5 text-sm text-fg-muted">추출된 액션 아이템이 없습니다.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle text-left text-xs text-fg-muted">
                    <th className="px-5 py-2.5 font-medium">우선순위</th>
                    <th className="px-5 py-2.5 font-medium">할 일</th>
                    <th className="px-5 py-2.5 font-medium">담당</th>
                    <th className="px-5 py-2.5 font-medium">기한</th>
                  </tr>
                </thead>
                <tbody>
                  {r.action_items.map((a, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-subtle">
                      <td className="px-5 py-3"><Badge tone={a.priority === "높음" ? "red" : a.priority === "보통" ? "amber" : "gray"}>{a.priority}</Badge></td>
                      <td className="px-5 py-3">{a.task}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-fg-muted">{a.owner}</td>
                      <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-fg-muted">{a.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "reply" && (
          <div className="space-y-4 p-5">
            <div>
              <Label>제목</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label hint="자유롭게 수정하세요 · [대괄호]는 확인 후 채울 부분">본문</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} className="text-[14px]" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={`${subject}\n\n${body}`} label="제목+본문 복사" />
              <Button size="sm" onClick={download}><Download className="size-3.5" /> .txt 저장</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowKo((v) => !v)}>
                <Languages className="size-3.5" /> {showKo ? "번역 숨기기" : "한국어 번역 보기"}
              </Button>
            </div>
            {showKo && (
              <div className="rounded-md border border-border bg-bg-subtle p-4 text-sm leading-relaxed whitespace-pre-wrap text-fg-muted">
                {r.reply.korean_translation}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <Card className="space-y-4 p-5">
      <div className="skeleton h-5 w-2/3" />
      <div className="grid grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12" />)}</div>
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="skeleton h-4 w-4/6" />
      <p className="text-center text-xs text-fg-subtle">메시지를 분석하고 있습니다…</p>
    </Card>
  );
}

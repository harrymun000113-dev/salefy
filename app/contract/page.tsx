"use client";

import { ChevronDown, Download, FileText, FileUp, ShieldAlert, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/header";
import { postJson, useSettings } from "@/components/settings";
import { Badge, Button, Card, CardHeader, cn, CopyButton, Input, Label, Note, riskTone, Segmented, Stat } from "@/components/ui";
import { diffClauses, type ClauseRow } from "@/lib/diff";
import { SAMPLE_NDA_REVISED, SAMPLE_NDA_TEMPLATE } from "@/lib/samples";
import type { ContractReview } from "@/lib/schemas";

type Doc = { name: string; text: string } | null;

export default function ContractPage() {
  const { apiKey } = useSettings();
  const [tpl, setTpl] = useState<Doc>(null);
  const [rev, setRev] = useState<Doc>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContractReview | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const diff = useMemo(() => (tpl && rev ? diffClauses(tpl.text, rev.text) : null), [tpl, rev]);

  function loadSample() {
    setTpl({ name: "NDA_표준템플릿.txt", text: SAMPLE_NDA_TEMPLATE });
    setRev({ name: "NDA_바이어수정본.txt", text: SAMPLE_NDA_REVISED });
    setResult(null); setError("");
  }

  async function analyze() {
    setLoading(true); setError("");
    try {
      const res = await postJson<ContractReview>(
        "/api/contract",
        { template: tpl?.text ?? "", revised: rev?.text ?? "", context },
        apiKey,
      );
      setResult(res.data); setIsDemo(!!res.demo);
      requestAnimationFrame(() => document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="계약서 비교 & 독소조항 검토"
        desc="회사 표준 템플릿과 바이어가 보낸 수정본을 올리면, 바뀐 조항을 표시하고 공급자 입장에서 불리한 조항과 대안 문구를 정리합니다."
        right={<Button size="sm" onClick={loadSample}><FileText className="size-3.5" /> 예시 NDA 불러오기</Button>}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* 업로드 */}
        <div className="grid gap-4 md:grid-cols-2">
          <DropZone step="01" label="우리 회사 표준 템플릿" doc={tpl} onChange={(d) => { setTpl(d); setResult(null); }} onError={setError} />
          <DropZone step="02" label="바이어 수정본" doc={rev} onChange={(d) => { setRev(d); setResult(null); }} onError={setError} />
        </div>
        <div>
          <Label hint="선택 · 분석 정확도가 올라갑니다">거래 맥락</Label>
          <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="예) 미국 유통사, 연 50만 달러 규모, FOB Busan, 첫 거래" />
        </div>

        {error && <Note tone="red" title="문제가 생겼습니다">{error}</Note>}

        {/* 비교 */}
        {diff && <DiffCard rows={diff.rows} stats={diff.stats} />}

        {/* AI 분석 */}
        {(tpl || rev) && (
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-2"><ShieldAlert className="size-4" /> AI 리스크 분석</span>}
              desc={tpl && rev ? "두 문서를 조항별로 대조해 공급자에게 불리한 변경을 찾습니다." : "문서 하나만 올리면 단독 검토 모드로 분석합니다."}
              right={
                <Button variant="primary" size="sm" onClick={analyze} loading={loading}>
                  {!loading && <Sparkles className="size-3.5" />}
                  {loading ? "검토 중…" : result ? "다시 분석" : "분석 시작"}
                </Button>
              }
            />
            {!result && !loading && (
              <div className="px-5 py-10 text-center text-sm text-fg-muted">
                바이어 수정본의 변경 조항을 독소조항 패턴과 대조합니다.
                <div className="mt-1 text-xs text-fg-subtle">데모 모드 · 독소조항 패턴 사전으로 분석하며 외부 API를 호출하지 않습니다</div>
              </div>
            )}
            {loading && (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}
                <p className="text-center text-xs text-fg-subtle">조항을 하나씩 검토하고 있습니다…</p>
              </div>
            )}
          </Card>
        )}

        {result && !loading && <Analysis r={result} demo={isDemo} />}
      </div>
    </>
  );
}

/* ---------------- 업로드 영역 ---------------- */
function DropZone({ step, label, doc, onChange, onError }: {
  step: string; label: string; doc: Doc; onChange: (d: Doc) => void; onError: (m: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handle(file: File) {
    setBusy(true); onError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onChange({ name: file.name, text: json.text });
    } catch (e) {
      onError(`${file.name}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-[13px] font-medium">
        <span className="font-mono text-[11px] text-fg-subtle">{step}</span> {label}
      </div>
      {doc ? (
        <div className="flex h-28 items-center gap-4 rounded-lg border border-border bg-bg px-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-bg-subtle"><FileText className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{doc.name}</div>
            <div className="mt-0.5 font-mono text-xs text-fg-subtle">{doc.text.length.toLocaleString()} chars</div>
          </div>
          <button onClick={() => onChange(null)} className="rounded p-1.5 text-fg-muted hover:bg-bg-muted hover:text-fg" aria-label="파일 제거">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
          className={cn(
            "flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm transition-colors",
            drag ? "border-blue bg-blue-bg" : "border-border-strong bg-bg-subtle hover:bg-bg-muted",
          )}
        >
          <FileUp className={cn("size-5", busy ? "animate-pulse text-blue" : "text-fg-muted")} />
          <span className="font-medium">{busy ? "텍스트 추출 중…" : "파일을 끌어다 놓거나 클릭"}</span>
          <span className="text-xs text-fg-subtle">PDF · DOCX · TXT, 최대 4MB</span>
        </button>
      )}
      <input ref={input} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </div>
  );
}

/* ---------------- 비교 결과 ---------------- */
function DiffCard({ rows, stats }: { rows: ClauseRow[]; stats: { changed: number; added: number; removed: number; unchanged: number } }) {
  const [onlyChanges, setOnlyChanges] = useState<"all" | "changes">("all");
  const shown = onlyChanges === "changes" ? rows.filter((r) => r.kind !== "same") : rows;
  const label = { mod: "수정", rewrite: "수정", add: "추가", del: "삭제" } as const;

  return (
    <Card>
      <CardHeader
        title="문서 비교"
        desc="조항(문단) 단위로 맞춘 뒤 단어 단위로 표시합니다. API를 사용하지 않습니다."
        right={<Segmented value={onlyChanges} onChange={setOnlyChanges} options={[{ value: "all", label: "전체" }, { value: "changes", label: "변경만" }]} />}
      />
      <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4 sm:divide-x sm:divide-border">
        <Stat label="수정" value={stats.changed} tone={stats.changed ? "amber" : undefined} />
        <Stat label="추가" value={stats.added} tone={stats.added ? "green" : undefined} />
        <Stat label="삭제" value={stats.removed} tone={stats.removed ? "red" : undefined} />
        <Stat label="변경 없음" value={stats.unchanged} />
      </div>
      <div className="max-h-[560px] space-y-1 overflow-y-auto p-3 text-[14px] leading-relaxed">
        {shown.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 rounded-md px-3 py-2.5",
              r.kind === "same" && "text-fg-subtle",
              (r.kind === "mod" || r.kind === "rewrite") && "bg-amber-bg/60 shadow-[inset_2px_0_0_var(--amber)]",
              r.kind === "add" && "bg-green-bg/60 shadow-[inset_2px_0_0_var(--green)]",
              r.kind === "del" && "bg-red-bg/60 shadow-[inset_2px_0_0_var(--red)]",
            )}
          >
            <span className="w-8 shrink-0 pt-0.5 font-mono text-[10px] text-fg-subtle uppercase">
              {r.kind !== "same" && label[r.kind]}
            </span>
            <p className="min-w-0 flex-1">
              {r.kind === "mod"
                ? r.parts.map((p, j) =>
                    p.kind === "add" ? <ins key={j} className="rounded-sm bg-green-bg font-medium text-green no-underline">{p.text}</ins>
                    : p.kind === "del" ? <del key={j} className="rounded-sm bg-red-bg text-red">{p.text}</del>
                    : <span key={j}>{p.text}</span>)
                : r.kind === "rewrite" ? (
                    <span className="block space-y-1.5">
                      <del className="block text-red">{r.old}</del>
                      <ins className="block font-medium text-green no-underline">{r.new}</ins>
                    </span>
                  )
                : r.kind === "del" ? <del className="text-red">{r.text}</del>
                : r.text}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- AI 분석 결과 ---------------- */
function Analysis({ r, demo }: { r: ContractReview; demo: boolean }) {
  const [level, setLevel] = useState<"all" | "높음" | "중간" | "낮음">("all");
  const count = (l: string) => r.findings.filter((f) => f.risk_level === l).length;
  const shown = level === "all" ? r.findings : r.findings.filter((f) => f.risk_level === level);

  const exportMd = () => {
    const md = [
      `# 계약서 검토 결과 — ${r.contract_type}`, "", `종합 위험도: **${r.overall_risk}**`, "", r.executive_summary, "",
      ...r.findings.flatMap((f) => [
        `## [${f.risk_level}] ${f.clause_ref} (${f.category} · ${f.change_type})`, "",
        f.original_text && `**표준 템플릿:** ${f.original_text}`, f.revised_text && `**바이어 수정본:** ${f.revised_text}`, "",
        `**왜 위험한가:** ${f.why_risky}`, `**권장 대응:** ${f.recommendation}`,
        f.counter_proposal && `**대안 문구:** ${f.counter_proposal}`, "",
      ].filter((x): x is string => typeof x === "string")),
      "## 빠진 보호 조항", ...r.missing_protections.map((m) => `- ${m}`), "", "## 협상 메일 초안", "", r.negotiation_email,
    ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" })), download: "contract_review.md",
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div id="analysis" className="scroll-mt-28 space-y-4">
      {demo && <Note tone="blue"><b>데모 모드</b> 결과입니다. 포트폴리오 버전은 독소조항 패턴 사전으로 분석하며, 정식 버전에서는 Claude API가 조항 의미까지 해석합니다.</Note>}

      <Card>
        <div className="grid grid-cols-2 divide-border border-b border-border sm:grid-cols-4 sm:divide-x">
          <Stat label="종합 위험도" value={<Badge tone={riskTone(r.overall_risk)} className="h-6 px-2.5 text-sm">{r.overall_risk}</Badge>} />
          <Stat label="계약 유형" value={<span className="text-base">{r.contract_type}</span>} />
          <Stat label="고위험" value={`${count("높음")}건`} tone={count("높음") ? "red" : undefined} />
          <Stat label="전체 지적" value={`${r.findings.length}건`} />
        </div>
        <p className="px-5 py-4 text-sm leading-relaxed">{r.executive_summary}</p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={level}
          onChange={setLevel}
          options={[
            { value: "all", label: `전체 ${r.findings.length}` },
            { value: "높음", label: `높음 ${count("높음")}` },
            { value: "중간", label: `중간 ${count("중간")}` },
            { value: "낮음", label: `낮음 ${count("낮음")}` },
          ]}
        />
        <Button size="sm" onClick={exportMd}><Download className="size-3.5" /> 리포트 저장 (.md)</Button>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        {shown.map((f, i) => <Finding key={`${f.clause_ref}-${i}`} f={f} defaultOpen={f.risk_level === "높음" && i < 2} />)}
        {shown.length === 0 && <p className="p-5 text-sm text-fg-muted">해당 위험도의 조항이 없습니다.</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {r.missing_protections.length > 0 && (
          <Card className="h-fit">
            <CardHeader title="빠진 보호 조항" desc="공급자로서 추가를 요청할 만한 조항" />
            <ul className="space-y-2 p-5 text-sm">
              {r.missing_protections.map((m, i) => (
                <li key={i} className="flex gap-2.5"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber" />{m}</li>
              ))}
            </ul>
          </Card>
        )}
        <Card>
          <CardHeader title="바이어 협상 메일 초안" right={<CopyButton text={r.negotiation_email} />} />
          <pre className="max-h-[420px] overflow-y-auto p-5 font-sans text-sm leading-relaxed whitespace-pre-wrap">{r.negotiation_email}</pre>
        </Card>
      </div>
    </div>
  );
}

function Finding({ f, defaultOpen }: { f: ContractReview["findings"][number]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-bg-subtle">
        <Badge tone={riskTone(f.risk_level)} className="w-12 justify-center">{f.risk_level}</Badge>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.clause_ref}</span>
        <span className="hidden gap-1.5 sm:flex">
          <Badge>{f.category}</Badge>
          <Badge tone={f.change_type === "추가" ? "green" : f.change_type === "삭제" ? "red" : f.change_type === "수정" ? "amber" : "purple"}>{f.change_type}</Badge>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-fg-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 px-5 pt-1 pb-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border bg-bg-subtle p-4">
              <div className="mb-1.5 font-mono text-[11px] tracking-wide text-fg-subtle uppercase">표준 템플릿</div>
              <p className="text-[13px] leading-relaxed text-fg-muted">{f.original_text || "(없음)"}</p>
            </div>
            <div className="rounded-md border border-red/25 bg-red-bg/50 p-4">
              <div className="mb-1.5 font-mono text-[11px] tracking-wide text-red uppercase">바이어 수정본</div>
              <p className="text-[13px] leading-relaxed">{f.revised_text || "(삭제됨)"}</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-[96px_1fr]">
            <dt className="text-fg-muted">왜 위험한가</dt><dd className="leading-relaxed">{f.why_risky}</dd>
            <dt className="text-fg-muted">권장 대응</dt><dd className="leading-relaxed font-medium">{f.recommendation}</dd>
          </dl>
          {f.counter_proposal && (
            <div className="rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-xs font-medium text-fg-muted">대안 문구 (영문)</span>
                <CopyButton text={f.counter_proposal} />
              </div>
              <p className="px-4 py-3 font-mono text-[13px] leading-relaxed">{f.counter_proposal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

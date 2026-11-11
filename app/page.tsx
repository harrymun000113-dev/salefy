import { ArrowRight, ArrowUpRight, FileText, Mail, Search, Receipt, NotebookPen } from "lucide-react";
import Link from "next/link";
import { MODULES } from "@/lib/modules";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail, contract: FileText, buyer: Search, quote: Receipt, meeting: NotebookPen,
};

export default function Home() {
  const active = MODULES.filter((m) => m.href);
  const upcoming = MODULES.filter((m) => !m.href);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs text-fg-muted">
            <span className="size-1.5 rounded-full bg-blue" /> 해외영업 실무자를 위한 AI 워크스페이스
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl leading-[1.15] font-semibold tracking-tight sm:text-6xl">
            메일과 계약서는 AI에게,
            <br />
            <span className="text-fg-muted">협상과 관계는 당신에게.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-fg-muted">
            바이어 이메일 요약부터 비즈니스 영문 답장, 계약서 독소조항 검토까지. 반복 업무를 몇 초로 줄여보세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/email" className="inline-flex h-11 items-center gap-2 rounded-md bg-fg px-5 text-sm font-medium text-bg hover:opacity-90">
              이메일 분석 시작 <ArrowRight className="size-4" />
            </Link>
            <Link href="/contract" className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-bg px-5 text-sm font-medium hover:bg-bg-muted">
              계약서 검토하기
            </Link>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">도구</h2>
            <p className="text-sm text-fg-muted">지금 바로 쓸 수 있는 기능</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((m) => {
            const Icon = ICONS[m.key];
            return (
              <Link key={m.key} href={m.href!} className="group rounded-lg border border-border bg-bg p-6 transition-colors hover:border-border-strong hover:bg-bg-subtle">
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-md border border-border bg-bg-subtle">
                    <Icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{m.desc}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {m.tags.map((t) => (
                    <span key={t} className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-fg-muted">{t}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-14 mb-4 text-sm font-medium text-fg-muted">곧 추가될 기능</h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {upcoming.map((m) => {
            const Icon = ICONS[m.key];
            return (
              <div key={m.key} className="bg-bg p-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4 text-fg-muted" /> {m.title}
                </div>
                <p className="mt-1.5 text-[13px] text-fg-muted">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

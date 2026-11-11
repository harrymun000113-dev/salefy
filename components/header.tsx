"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings, ThemeToggle } from "./settings";
import { cn } from "./ui";

export const NAV = [
  { href: "/", label: "개요" },
  { href: "/email", label: "이메일 어시스턴트" },
  { href: "/contract", label: "계약서 검토" },
];

export function Logo() {
  return (
    <span className="grid size-6 place-items-center rounded-md bg-fg text-bg">
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M17 7.5c-1-1.5-2.8-2.5-5-2.5-3 0-5 1.6-5 3.8 0 4.7 10 2.6 10 7.4 0 2.2-2.1 3.8-5 3.8-2.4 0-4.3-1-5.3-2.7" />
      </svg>
    </span>
  );
}

export function Header() {
  const path = usePathname();
  const { apiKey } = useSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <Logo /> Salefy
        </Link>
        <span className="text-border-strong">/</span>
        <span className="hidden text-sm text-fg-muted sm:inline">해외영업 워크스페이스</span>

        <div className="ml-auto flex items-center gap-1">
          <span
            title="포트폴리오 데모: 외부 API를 호출하지 않습니다"
            className="flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-[13px] text-fg-muted"
          >
            <span className="size-1.5 rounded-full bg-green" />
            {apiKey ? "Claude 연결됨" : "Demo"}
          </span>
          <ThemeToggle />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 sm:px-4">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "relative px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                active ? "text-fg after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function PageHeader({ title, desc, right }: { title: string; desc: string; right?: React.ReactNode }) {
  return (
    <div className="border-b border-border bg-bg-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{desc}</p>
        </div>
        {right}
      </div>
    </div>
  );
}

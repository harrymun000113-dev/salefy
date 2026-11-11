"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost";
export function Button({
  variant = "secondary", size = "md", loading, className, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
        variant === "secondary" && "border border-border bg-bg text-fg hover:bg-bg-muted",
        variant === "ghost" && "text-fg-muted hover:bg-bg-muted hover:text-fg",
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border border-border bg-bg", className)}>{children}</div>;
}
export function CardHeader({ title, desc, right }: { title: ReactNode; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {desc && <p className="mt-0.5 text-[13px] text-fg-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- Badge ---------- */
export type Tone = "gray" | "blue" | "red" | "amber" | "green" | "purple";
const toneCls: Record<Tone, string> = {
  gray: "bg-bg-muted text-fg-muted",
  blue: "bg-blue-bg text-blue",
  red: "bg-red-bg text-red",
  amber: "bg-amber-bg text-amber",
  green: "bg-green-bg text-green",
  purple: "bg-purple-bg text-purple",
};
export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium whitespace-nowrap", toneCls[tone], className)}>
      {children}
    </span>
  );
}
export const riskTone = (r: string): Tone => (r === "높음" || r === "긴급" ? "red" : r === "중간" || r === "보통" ? "amber" : "green");

/* ---------- Form ---------- */
export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[13px] font-medium text-fg">{children}</span>
      {hint && <span className="text-xs text-fg-subtle">{hint}</span>}
    </div>
  );
}
const field =
  "w-full rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-fg-subtle transition-shadow focus:border-border-strong focus:outline-none focus:ring-4 focus:ring-[color-mix(in_srgb,var(--fg)_8%,transparent)]";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(field, "h-10", props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(field, "resize-y py-2.5 leading-relaxed", props.className)} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  return (
    <select {...props} className={cn(field, "h-10 cursor-pointer pr-8", props.className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-bg-subtle p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-[5px] px-3 text-[13px] font-medium transition-colors",
            value === o.value ? "bg-bg text-fg shadow-[0_0_0_1px_var(--border)]" : "text-fg-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Tabs (underline) ---------- */
export function Tabs<T extends string>({ value, onChange, tabs }: {
  value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode; count?: number }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative -mb-px flex h-11 items-center gap-2 px-3 text-sm transition-colors",
            value === t.value ? "text-fg after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="rounded-full bg-bg-muted px-1.5 text-[11px] text-fg-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Stat ---------- */
export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="px-5 py-4">
      <div className="font-mono text-[11px] tracking-wide text-fg-subtle uppercase">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tracking-tight", tone && toneCls[tone].split(" ")[1])}>{value}</div>
    </div>
  );
}

/* ---------- Copy button ---------- */
export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
      {done ? "복사됨" : label}
    </Button>
  );
}

/* ---------- Alerts ---------- */
export function Note({ tone = "gray", title, children }: { tone?: Tone; title?: ReactNode; children: ReactNode }) {
  const border: Record<Tone, string> = {
    gray: "border-border", blue: "border-blue/30", red: "border-red/30", amber: "border-amber/30", green: "border-green/30", purple: "border-purple/30",
  };
  return (
    <div className={cn("rounded-md border px-4 py-3 text-[13px] leading-relaxed", border[tone], toneCls[tone].split(" ")[0])}>
      {title && <div className={cn("mb-1 font-semibold", toneCls[tone].split(" ")[1])}>{title}</div>}
      <div className="text-fg">{children}</div>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">{children}</kbd>;
}

"use client";

import { KeyRound, Moon, Sun, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button, Input, Label, Note } from "./ui";

const KEY_STORAGE = "salefy.apiKey";

type Ctx = { apiKey: string; setApiKey: (k: string) => void; openSettings: () => void };
const SettingsCtx = createContext<Ctx>({ apiKey: "", setApiKey: () => {}, openSettings: () => {} });
export const useSettings = () => useContext(SettingsCtx);

function safeGet(k: string) { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } }
function safeSet(k: string, v: string) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} }

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setKey] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => setKey(safeGet(KEY_STORAGE)), []);
  const setApiKey = (k: string) => { setKey(k); safeSet(KEY_STORAGE, k); };

  return (
    <SettingsCtx.Provider value={{ apiKey, setApiKey, openSettings: () => setOpen(true) }}>
      {children}
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </SettingsCtx.Provider>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey } = useSettings();
  const [draft, setDraft] = useState(apiKey);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4" /> API 설정</div>
          <button onClick={onClose} className="rounded p-1 text-fg-muted hover:bg-bg-muted hover:text-fg" aria-label="닫기"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <Label hint="이 브라우저에만 저장">Anthropic API 키</Label>
            <Input type="password" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="sk-ant-..." autoFocus />
          </div>
          <Note>
            배포 환경에서는 Vercel 프로젝트의 환경변수 <code className="font-mono text-xs">ANTHROPIC_API_KEY</code>에 키를 넣는 것을 권장합니다.
            서버에 키가 있으면 여기 입력한 키보다 우선 사용됩니다.
          </Note>
        </div>
        <div className="flex justify-between gap-2 rounded-b-xl border-t border-border bg-bg-subtle px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => { setApiKey(""); setDraft(""); }}>키 삭제</Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose}>취소</Button>
            <Button size="sm" variant="primary" onClick={() => { setApiKey(draft.trim()); onClose(); }}>저장</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    safeSet("salefy.theme", next ? "dark" : "light");
  };
  return (
    <button onClick={toggle} aria-label="테마 전환" className="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-bg-muted hover:text-fg">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/** API 라우트 호출 공통 함수 */
export async function postJson<T>(url: string, body: unknown, apiKey: string): Promise<{ data: T; demo?: boolean; usage?: { input: number; output: number; model: string } }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(apiKey ? { "x-anthropic-key": apiKey } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ error: `서버 오류 (${res.status})` }));
  if (!res.ok) throw new Error(json.error || `서버 오류 (${res.status})`);
  return json;
}

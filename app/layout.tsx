import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { SettingsProvider } from "@/components/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salefy · 해외영업 AI",
  description: "이메일 요약·답장, 계약서 독소조항 검토까지. 해외영업 실무자를 위한 AI 워크스페이스.",
};

// 첫 렌더 전에 저장된 테마(또는 OS 설정)를 적용해 깜빡임 방지
const themeScript = `try{var t=localStorage.getItem('salefy.theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <SettingsProvider>
          <Header />
          <main>{children}</main>
          <footer className="mt-20 border-t border-border">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:justify-between sm:px-6">
              <span>Salefy · Powered by Claude</span>
              <span>AI 결과는 검토 보조용입니다. 계약·가격 확정 전 반드시 담당자 확인을 거치세요.</span>
            </div>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}

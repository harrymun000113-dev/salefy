import { diffArrays, diffWordsWithSpace } from "diff";

export type WordPart = { text: string; kind: "same" | "add" | "del" };
export type ClauseRow =
  | { kind: "same"; text: string }
  | { kind: "add"; text: string }
  | { kind: "del"; text: string }
  | { kind: "mod"; parts: WordPart[] }
  | { kind: "rewrite"; old: string; new: string }; // 거의 다 바뀐 조항은 전/후를 따로 표시

// 조항 시작으로 볼 줄: "1.", "12.3", "(a)", "Article 5", "Section 2", "제3조", 전부 대문자 제목
const NUMBERED = /^\s*(\d+(\.\d+)*[.)]?\s|\([a-z0-9]+\)\s|(article|section|clause)\s+\d+|제\s*\d+\s*조)/i;
const ALL_CAPS = /^\s*[A-Z][A-Z\s&,-]{6,}$/;
const isHeading = (l: string) => NUMBERED.test(l) || ALL_CAPS.test(l);

/** 조항(문단) 단위로 쪼갭니다. PDF처럼 빈 줄이 없는 텍스트는 조항 번호를 기준으로 나누고, 끊긴 줄은 다시 잇습니다. */
export function splitClauses(text: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  const flush = () => {
    const s = cur.join(" ").replace(/\s+/g, " ").trim();
    if (s) out.push(s);
    cur = [];
  };
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    if (!line.trim()) { flush(); continue; }
    if (isHeading(line) && cur.length) flush();
    cur.push(line.trim());
  }
  flush();
  return out;
}

/** 조항 단위로 맞춘 뒤, 바뀐 조항은 단어 단위로 표시합니다. */
export function diffClauses(original: string, revised: string) {
  const a = splitClauses(original);
  const b = splitClauses(revised);
  const rows: ClauseRow[] = [];
  const stats = { changed: 0, added: 0, removed: 0, unchanged: 0 };

  const chunks = diffArrays(a, b);
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const next = chunks[i + 1];
    // 삭제 뒤에 바로 추가가 오면 "수정"으로 짝지어 단어 단위 비교
    if (c.removed && next?.added) {
      const n = Math.max(c.value.length, next.value.length);
      for (let k = 0; k < n; k++) {
        const o = c.value[k];
        const nw = next.value[k];
        if (o && nw) {
          stats.changed++;
          const parts: WordPart[] = diffWordsWithSpace(o, nw).map((p) => ({
            text: p.value,
            kind: p.added ? "add" : p.removed ? "del" : "same",
          }));
          const kept = parts.filter((p) => p.kind === "same").reduce((n, p) => n + p.text.trim().length, 0);
          if (kept / Math.max(o.length, nw.length) < 0.5) rows.push({ kind: "rewrite", old: o, new: nw });
          else rows.push({ kind: "mod", parts });
        } else if (o) {
          stats.removed++;
          rows.push({ kind: "del", text: o });
        } else if (nw) {
          stats.added++;
          rows.push({ kind: "add", text: nw });
        }
      }
      i++;
      continue;
    }
    for (const text of c.value) {
      if (c.added) { stats.added++; rows.push({ kind: "add", text }); }
      else if (c.removed) { stats.removed++; rows.push({ kind: "del", text }); }
      else { stats.unchanged++; rows.push({ kind: "same", text }); }
    }
  }
  return { rows, stats };
}

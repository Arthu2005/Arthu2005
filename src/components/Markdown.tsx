import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { isSafeUrl } from "@/lib/content/fields";
import { cn } from "@/lib/cn";

/**
 * Minimal, safe Markdown renderer (no raw HTML, output built as React elements).
 * Supports: ### headings, paragraphs, - / 1. lists, > quotes, | tables |, **bold**, *italic*, [links](url).
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3]}</em>);
    else if (m[4] && m[5]) {
      const href = m[5];
      if (!isSafeUrl(href)) out.push(m[4]);
      else if (href.startsWith("/")) out.push(<Link key={k} href={href}>{m[4]}</Link>);
      else
        out.push(
          <a key={k} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
            {m[4]}
          </a>,
        );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string | undefined | null; className?: string }) {
  if (!source?.trim()) return null;
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className={cn("prose-ptl", className)}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (!lines.length) return null;
        const k = `b${bi}`;
        if (/^#{1,6}\s/.test(lines[0]!)) {
          const text = lines[0]!.replace(/^#{1,6}\s+/, "");
          return (
            <Fragment key={k}>
              <h3>{inline(text, k)}</h3>
              {lines.length > 1 && <p>{inline(lines.slice(1).join(" "), `${k}p`)}</p>}
            </Fragment>
          );
        }
        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={k}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*]\s+/, ""), `${k}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={k}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${k}-${li}`)}</li>
              ))}
            </ol>
          );
        }
        if (lines.every((l) => l.startsWith(">"))) {
          return <blockquote key={k}>{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), k)}</blockquote>;
        }
        if (lines.length >= 2 && lines.every((l) => l.trim().startsWith("|"))) {
          const rows = lines
            .filter((l) => !/^\|?\s*:?-{2,}/.test(l.trim().replace(/^\|/, "").trim()))
            .map((l) =>
              l
                .trim()
                .replace(/^\||\|$/g, "")
                .split("|")
                .map((c) => c.trim()),
            );
          const [head, ...body] = rows;
          return (
            <div key={k} className="overflow-x-auto">
              <table>
                <thead>
                  <tr>{head!.map((c, ci) => <th key={ci}>{inline(c, `${k}h${ci}`)}</th>)}</tr>
                </thead>
                <tbody>
                  {body.map((r, ri) => (
                    <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, `${k}r${ri}c${ci}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={k}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${k}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("text-[14.5px] leading-[1.55]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-3 mb-1.5 font-display text-lg font-semibold tracking-[-0.02em] first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-1.5 font-display text-base font-semibold tracking-[-0.02em] first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2.5 mb-1 font-display text-sm font-semibold tracking-[-0.015em] first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          hr: () => <hr className="my-3 border-border" />,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary-strong underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-[var(--radius-md)] border border-border">
              <table className="w-full border-collapse text-[13.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-secondary">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-left text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 tabular-nums last:border-b-0">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

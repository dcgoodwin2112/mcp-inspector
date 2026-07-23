import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Compact markdown rendering for model output in timeline cards. Safe by
 * construction (react-markdown builds elements, never injects HTML); raw HTML
 * in the source is ignored.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h3 className="text-base font-semibold" {...p} />,
          h2: (p) => <h3 className="text-base font-semibold" {...p} />,
          h3: (p) => <h4 className="text-sm font-semibold" {...p} />,
          h4: (p) => <h4 className="text-sm font-semibold" {...p} />,
          ul: (p) => <ul className="list-disc space-y-0.5 pl-5" {...p} />,
          ol: (p) => <ol className="list-decimal space-y-0.5 pl-5" {...p} />,
          a: (p) => (
            <a
              className="text-cyan-700 underline dark:text-cyan-400"
              target="_blank"
              rel="noreferrer"
              {...p}
            />
          ),
          code: (p) => (
            <code
              className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800"
              {...p}
            />
          ),
          pre: (p) => (
            <pre
              className="overflow-x-auto rounded bg-zinc-100 p-2 font-mono text-xs leading-relaxed dark:bg-zinc-800 [&>code]:bg-transparent [&>code]:p-0"
              {...p}
            />
          ),
          blockquote: (p) => (
            <blockquote
              className="border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
              {...p}
            />
          ),
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="text-xs [&_td]:border [&_td]:border-zinc-200 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-zinc-200 [&_th]:bg-zinc-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700 dark:[&_th]:bg-zinc-800" {...p} />
            </div>
          ),
          hr: () => <hr className="border-zinc-200 dark:border-zinc-700" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

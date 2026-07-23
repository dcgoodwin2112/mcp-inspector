"use client";

import type { AgentLoop, ContentBlock } from "@/lib/agent";
import type { LiveSession } from "@/lib/live";

/**
 * Read-only view of the EXACT context the next model call will send — read
 * live from the agent loop (system prompt incl. attached resources, the full
 * conversation array, tool definitions), never from a parallel copy. The
 * answer to "what does the model actually see?".
 */

/** Rough size estimate: ~4 chars per token, labeled as an estimate in the UI. */
function tok(chars: number): string {
  return `~${Math.max(1, Math.round(chars / 4)).toLocaleString()} tok`;
}

function Section({
  title,
  size,
  children,
  open = false,
}: {
  title: string;
  size: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="rounded border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="flex cursor-pointer select-none items-center gap-2 px-2 py-1.5 text-xs">
        <span className="font-semibold">{title}</span>
        <span className="ml-auto font-mono text-[10px] text-zinc-400">{size}</span>
      </summary>
      <div className="border-t border-zinc-100 px-2 py-1.5 dark:border-zinc-800">{children}</div>
    </details>
  );
}

function Blocks({ content }: { content: unknown }) {
  if (typeof content === "string") {
    return (
      <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded bg-zinc-50 p-1.5 font-mono text-[11px] leading-relaxed dark:bg-zinc-950">
        {content}
      </pre>
    );
  }
  const blocks = (content as ContentBlock[]) ?? [];
  return (
    <div className="space-y-1">
      {blocks.map((b, i) => {
        if (b.type === "text") {
          return (
            <pre
              key={i}
              className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded bg-zinc-50 p-1.5 font-mono text-[11px] leading-relaxed dark:bg-zinc-950"
            >
              {b.text}
            </pre>
          );
        }
        if (b.type === "tool_use") {
          return (
            <div key={i} className="rounded border-l-2 border-cyan-500 bg-zinc-50 p-1.5 dark:bg-zinc-950">
              <span className="font-mono text-[11px] font-semibold">⚙ tool_use · {b.name}</span>
              <pre className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[10px]">
                {JSON.stringify(b.input, null, 1)}
              </pre>
            </div>
          );
        }
        const generic = b as unknown as {
          type: string;
          is_error?: boolean;
          content?: Array<{ text?: string }>;
        };
        if (generic.type === "tool_result") {
          return (
            <div
              key={i}
              className={`rounded border-l-2 p-1.5 ${
                generic.is_error
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                  : "border-emerald-500 bg-zinc-50 dark:bg-zinc-950"
              }`}
            >
              <span className="font-mono text-[11px] font-semibold">
                ↩ tool_result{generic.is_error ? " · error" : ""}
              </span>
              <pre className="mt-0.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[10px]">
                {generic.content?.map((c) => c.text).join("\n") ?? ""}
              </pre>
            </div>
          );
        }
        return (
          <pre key={i} className="max-h-24 overflow-y-auto break-all font-mono text-[10px]">
            {JSON.stringify(b, null, 1)}
          </pre>
        );
      })}
    </div>
  );
}

export function ContextInspector({
  loop,
  session,
}: {
  loop: AgentLoop;
  session: LiveSession;
}) {
  const system = loop.system;
  const messages = loop.getMessages();
  const tools = session.toolItems;
  const attached = session.attached;

  const messagesChars = JSON.stringify(messages).length;
  const toolsChars = JSON.stringify(
    tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.schema })),
  ).length;
  const totalChars = system.length + messagesChars + toolsChars;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-t-md border border-b-0 border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
        <span className="text-xs font-semibold uppercase text-zinc-500">Context</span>
        <span className="text-xs text-zinc-400">
          what the next model call will send — nothing else exists for the model
        </span>
        <span className="ml-auto font-mono text-[10px] text-zinc-400">total {tok(totalChars)}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-1.5">
        <Section title="System prompt" size={tok(system.length)} open>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded bg-zinc-50 p-1.5 font-mono text-[11px] leading-relaxed dark:bg-zinc-950">
            {system}
          </pre>
          {attached.length > 0 && (
            <p className="mt-1 text-[10px] text-zinc-400">
              includes {attached.length} attached resource{attached.length === 1 ? "" : "s"}:{" "}
              {attached.map((a) => a.uri).join(", ")}
            </p>
          )}
        </Section>

        <Section
          title={`Conversation (${messages.length} message${messages.length === 1 ? "" : "s"})`}
          size={tok(messagesChars)}
          open={messages.length > 0}
        >
          {messages.length === 0 ? (
            <p className="text-[11px] text-zinc-400">
              No conversation yet — the model has not been called this session.
            </p>
          ) : (
            <div className="space-y-1.5">
              {messages.map((m, i) => (
                <div key={i}>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      m.role === "user"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-fuchsia-700 dark:text-fuchsia-400"
                    }`}
                  >
                    {m.role}
                  </span>
                  <Blocks content={m.content} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={`Tool definitions (${tools.length})`} size={tok(toolsChars)}>
          <div className="flex flex-wrap gap-1">
            {tools.map((t) => (
              <span
                key={t.name}
                title={t.description}
                className="rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[11px] dark:border-zinc-700"
              >
                {t.name}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">
            full name + description + inputSchema for every tool, sent on every call
          </p>
        </Section>
      </div>
    </div>
  );
}

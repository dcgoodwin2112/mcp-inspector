"use client";

import { useState } from "react";
import type { AgentLoop } from "@/lib/agent";

/** Agent mode: the model drives the loop; step mode pauses between hops. */
export function AgentChat({
  loop,
  busy,
  waiting,
  onSend,
}: {
  loop: AgentLoop;
  busy: boolean;
  waiting: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [stepMode, setStepMode] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase text-fuchsia-700 dark:text-fuchsia-400">
        agent
      </span>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask the model — it drives the tools…"
        className="min-w-64 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={busy || !text.trim()}
        className="rounded-md bg-fuchsia-700 px-4 py-1 text-sm font-medium text-white hover:bg-fuchsia-600 disabled:opacity-50"
      >
        Send
      </button>
      <label className="flex items-center gap-1 text-xs text-zinc-500">
        <input
          type="checkbox"
          checked={stepMode}
          onChange={(e) => {
            setStepMode(e.target.checked);
            loop.stepMode = e.target.checked;
          }}
        />
        step between hops
      </label>
      {waiting && (
        <button
          type="button"
          onClick={() => loop.continueStep()}
          className="animate-pulse rounded-md border border-fuchsia-400 px-3 py-1 text-sm font-medium text-fuchsia-700 dark:border-fuchsia-700 dark:text-fuchsia-300"
        >
          Continue ▸
        </button>
      )}
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { CapabilityItem } from "@/lib/events";
import type { AgentLoop } from "@/lib/agent";

/** Agent mode: the model drives the loop; step mode pauses between hops.
 *  Typing "/" opens the prompt slash-command picker (user-controlled primitive). */
export function AgentChat({
  loop,
  busy,
  waiting,
  onSend,
  prompts = [],
  onSlashSelect,
}: {
  loop: AgentLoop;
  busy: boolean;
  waiting: boolean;
  onSend: (text: string) => void;
  prompts?: CapabilityItem[];
  onSlashSelect?: (item: CapabilityItem) => void;
}) {
  const [text, setText] = useState("");
  const [stepMode, setStepMode] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const slash = text.startsWith("/") ? text.slice(1).toLowerCase() : null;
  const matches = useMemo(() => {
    if (slash === null || !onSlashSelect) return [];
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(slash) ||
        p.name.replace(/_/g, "-").toLowerCase().includes(slash),
    );
  }, [slash, prompts, onSlashSelect]);

  function select(item: CapabilityItem) {
    onSlashSelect?.(item);
    setText("");
    setHighlight(0);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(matches[Math.min(highlight, matches.length - 1)]);
    } else if (e.key === "Escape") {
      setText("");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (slash !== null) return; // Enter is handled by the picker
    if (!text.trim() || busy) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase text-fuchsia-700 dark:text-fuchsia-400">
        agent
      </span>
      <div className="relative min-w-64 flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Ask the model — or / for prompts…"
          autoComplete="off"
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {matches.length > 0 && (
          <ul className="absolute left-0 top-full z-20 mt-0.5 w-full overflow-hidden rounded-md border border-amber-300 bg-white shadow-lg dark:border-amber-800 dark:bg-zinc-900">
            {matches.map((p, i) => (
              <li key={p.name}>
                <button
                  type="button"
                  onMouseDown={() => select(p)}
                  className={`flex w-full items-baseline gap-2 px-2 py-1 text-left text-xs ${
                    i === highlight
                      ? "bg-amber-100 dark:bg-amber-950/60"
                      : "hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  }`}
                >
                  <span className="font-mono font-medium">/{p.name}</span>
                  <span className="truncate text-zinc-400">{p.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="submit"
        disabled={busy || !text.trim() || slash !== null}
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

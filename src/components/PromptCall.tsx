"use client";

import { useState } from "react";
import type { CapabilityItem } from "@/lib/events";

interface PromptArg {
  name: string;
  description?: string;
  required?: boolean;
}

/** User-controlled primitive: argument form → expansion shown before send. */
export function PromptCall({
  prompt,
  busy,
  onInvoke,
  onClose,
}: {
  prompt: CapabilityItem;
  busy: boolean;
  onInvoke: (name: string, args: Record<string, string>) => void;
  onClose: () => void;
}) {
  const args = (prompt.schema as PromptArg[] | undefined) ?? [];
  const [values, setValues] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const filled: Record<string, string> = {};
    for (const a of args) {
      const v = values[a.name];
      if (v?.trim()) filled[a.name] = v.trim();
    }
    onInvoke(prompt.name, filled);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
          prompt
        </span>
        <span className="font-mono text-sm font-medium">/{prompt.name}</span>
        <span className="text-xs text-zinc-400">expansion is shown before anything is sent</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕ close
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {args.map((a) => (
          <label key={a.name} className="block text-xs">
            <span className="font-mono">
              {a.name}
              {a.required && <span className="text-red-500">*</span>}
            </span>
            {a.description && <span className="block text-zinc-400">{a.description}</span>}
            <input
              type="text"
              value={values[a.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [a.name]: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-300 bg-white p-1.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        ))}
        {args.length === 0 && <p className="text-xs text-zinc-400">no arguments</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-2 rounded-md bg-amber-700 px-4 py-1 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {busy ? "Expanding…" : "Expand prompt"}
      </button>
    </form>
  );
}

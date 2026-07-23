"use client";

import { useMemo, useState } from "react";
import type { CapabilityItem } from "@/lib/events";
import { coerceValues, fieldsFromSchema } from "@/lib/schema-form";

/**
 * Manual/inspector mode: an auto-generated form from the tool's inputSchema.
 * No model involved — the resulting tool.call.requested has actor "user".
 * A tool without a schema (e.g. a hidden tool being force-called) falls back
 * to a raw JSON arguments textarea.
 */
export function ManualCall({
  tool,
  busy,
  calling = false,
  onCall,
  onClose,
}: {
  tool: CapabilityItem;
  busy: boolean;
  /** True only when THIS form's call is running — busy alone just disables. */
  calling?: boolean;
  onCall: (name: string, args: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const fields = useMemo(() => fieldsFromSchema(tool.schema), [tool.schema]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [rawArgs, setRawArgs] = useState("{}");
  const [rawError, setRawError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (fields.length === 0) {
      try {
        onCall(tool.name, JSON.parse(rawArgs) as Record<string, unknown>);
        setRawError(null);
      } catch {
        setRawError("arguments must be valid JSON");
      }
      return;
    }
    onCall(tool.name, coerceValues(fields, values));
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-cyan-300 bg-cyan-50/50 p-3 dark:border-cyan-900 dark:bg-cyan-950/20"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-400">
          manual call
        </span>
        <span className="font-mono text-sm font-medium">{tool.name}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕ close
        </button>
      </div>

      {fields.length === 0 ? (
        <label className="block text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            no schema available (hidden tool?) — raw JSON arguments
          </span>
          <textarea
            value={rawArgs}
            onChange={(e) => setRawArgs(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-zinc-300 bg-white p-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
          {rawError && <span className="text-red-600 dark:text-red-400">{rawError}</span>}
        </label>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.name} className={`block text-xs ${f.jsonText ? "sm:col-span-2" : ""}`}>
              <span className="font-mono">
                {f.name}
                {f.required && <span className="text-red-500">*</span>}
              </span>{" "}
              <span className="text-zinc-500 dark:text-zinc-400">{f.type}</span>
              {f.description && (
                <span className="block truncate text-zinc-500 dark:text-zinc-400" title={f.description}>
                  {f.description}
                </span>
              )}
              {f.type === "boolean" ? (
                <input
                  type="checkbox"
                  checked={values[f.name] === true}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked }))}
                  className="mt-1 block"
                />
              ) : f.enumValues ? (
                <select
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-900 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                >
                  <option value="">—</option>
                  {f.enumValues.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : f.jsonText ? (
                <textarea
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  rows={3}
                  placeholder={f.defaultValue}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white p-1.5 font-mono dark:border-zinc-700 dark:bg-zinc-900 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                />
              ) : (
                <input
                  type="text"
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  placeholder={f.defaultValue}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-900 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                />
              )}
            </label>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 rounded-md bg-cyan-700 px-4 py-1 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
      >
        {calling ? "Calling…" : "Call tool"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { CapabilityItem } from "@/lib/events";

/**
 * App-controlled primitive: templated URIs get inputs for their {vars}; the
 * resolved resource is read and attached to the model's context.
 */
export function ResourceAttach({
  resource,
  busy,
  onAttach,
  onClose,
}: {
  resource: CapabilityItem;
  busy: boolean;
  onAttach: (uri: string, name: string) => void;
  onClose: () => void;
}) {
  const vars = useMemo(
    () => [...(resource.uriTemplate ?? "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]),
    [resource.uriTemplate],
  );
  const [values, setValues] = useState<Record<string, string>>({});

  const uri = resource.isTemplate
    ? vars.reduce(
        (u, v) => u.replace(`{${v}}`, values[v] ?? `{${v}}`),
        resource.uriTemplate ?? resource.name,
      )
    : resource.name;
  const ready = !resource.isTemplate || vars.every((v) => values[v]?.trim());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (ready) onAttach(uri, resource.title ?? resource.name);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-indigo-300 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-400">
          resource
        </span>
        <span className="font-mono text-sm font-medium">{uri}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ✕ close
        </button>
      </div>
      {vars.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {vars.map((v) => (
            <label key={v} className="block text-xs">
              <span className="font-mono">{`{${v}}`}</span>
              <input
                type="text"
                value={values[v] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
                className="mt-1 w-full rounded border border-zinc-300 bg-white p-1.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
          ))}
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !ready}
        className="mt-2 rounded-md bg-indigo-700 px-4 py-1 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
      >
        {busy ? "Reading…" : "Read + attach to context"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventLog } from "@/lib/events";
import { RECORDINGS } from "@/lib/fixtures";
import { useReplay } from "@/hooks/useReplay";
import { isRpcEvent, useRawFrames } from "@/hooks/useRawFrames";
import { FramesDrawer } from "./FramesDrawer";
import { ReplayControls } from "./ReplayControls";
import { Timeline } from "./Timeline";

export function ReplayView({
  log: propLog,
  present = false,
}: {
  log: EventLog;
  present?: boolean;
}) {
  const [selected, setSelected] = useState("__prop");
  const log =
    selected === "__prop"
      ? propLog
      : (RECORDINGS.find((r) => r.id === selected)?.log ?? propLog);
  const { controller, state } = useReplay(log);
  const [rawFrames, toggleRawFrames] = useRawFrames();

  const visible = useMemo(() => log.events.slice(0, state.cursor), [log, state.cursor]);
  const timelineEvents = useMemo(() => visible.filter((e) => !isRpcEvent(e)), [visible]);
  const skipEvent = rawFrames ? undefined : isRpcEvent;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && /^(input|textarea|select)$/i.test(e.target.tagName)) {
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          controller.toggle();
          break;
        case "ArrowRight":
          controller.stepForward(skipEvent);
          break;
        case "ArrowLeft":
          controller.stepBack(skipEvent);
          break;
        case "Home":
          controller.restart();
          break;
        case "End":
          controller.seekEnd();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controller, skipEvent]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {present ? (
        <div className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-zinc-300 bg-white/85 px-4 py-2 opacity-60 shadow-lg backdrop-blur transition-opacity hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900/85">
          <ReplayControls controller={controller} state={state} skipEvent={skipEvent} />
        </div>
      ) : (
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-200 py-2.5 dark:border-zinc-800">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="__prop">Loaded session ({propLog.sessionId})</option>
          {RECORDINGS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <div className="flex-1">
          <ReplayControls controller={controller} state={state} skipEvent={skipEvent} />
        </div>
        <button
          type="button"
          onClick={toggleRawFrames}
          title="Show raw JSON-RPC frames"
          className={`rounded-md border px-2.5 py-1 font-mono text-xs ${
            rawFrames
              ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
              : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          {"{ }"} Raw frames
        </button>
      </div>
      )}
      <div className={`min-h-0 flex-1 pt-3 ${present ? "mx-auto w-full max-w-4xl" : ""}`}>
        <Timeline events={timelineEvents} emptyHint="Press ▶ (or space) to start the replay." />
      </div>
      {rawFrames && (
        <div className="h-64 shrink-0 pt-2">
          <FramesDrawer events={visible} />
        </div>
      )}
    </div>
  );
}

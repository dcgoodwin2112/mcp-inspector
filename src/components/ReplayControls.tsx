"use client";

import type { ReplayController, ReplayState } from "@/lib/replay";
import { SPEEDS } from "@/lib/replay";
import { formatClock } from "@/lib/ui";

function Btn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

export function ReplayControls({
  controller,
  state,
  skipEvent,
}: {
  controller: ReplayController;
  state: ReplayState;
  skipEvent?: (e: import("@/lib/events").InspectorEvent) => boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Btn onClick={() => controller.restart()} title="Restart (Home)">
        ⏮
      </Btn>
      <Btn onClick={() => controller.stepBack(skipEvent)} title="Step back (←)">
        ◂
      </Btn>
      <button
        type="button"
        onClick={() => controller.toggle()}
        title="Play/pause (space)"
        className="rounded-md bg-zinc-900 px-4 py-1 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {state.playing ? "⏸ Pause" : "▶ Play"}
      </button>
      <Btn onClick={() => controller.stepForward(skipEvent)} title="Step forward (→)">
        ▸
      </Btn>
      <Btn onClick={() => controller.seekEnd()} title="Skip to end (End)">
        ⏭
      </Btn>

      <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

      {SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => controller.setSpeed(s)}
          className={`rounded px-2 py-0.5 text-xs ${
            state.speed === s
              ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {s}×
        </button>
      ))}

      <span className="ml-auto font-mono text-xs text-zinc-500">
        {state.cursor}/{controller.total} · {formatClock(controller.currentT)}
      </span>
    </div>
  );
}

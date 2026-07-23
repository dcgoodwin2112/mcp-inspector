"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { EventLog } from "@/lib/events";
import { ReplayController, type ReplayState } from "@/lib/replay";

export function useReplay(log: EventLog): {
  controller: ReplayController;
  state: ReplayState;
} {
  const ref = useRef<ReplayController | null>(null);
  if (ref.current === null || ref.current.log !== log) {
    ref.current = new ReplayController(log);
  }
  const controller = ref.current;

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );

  useEffect(() => {
    return () => controller.pause();
  }, [controller]);

  return { controller, state };
}

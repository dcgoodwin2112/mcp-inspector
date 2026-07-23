"use client";

import { useSyncExternalStore } from "react";
import type { InspectorEvent } from "@/lib/events";
import type { EventLogStore } from "@/lib/store";

export function useEventLog(store: EventLogStore): InspectorEvent[] {
  return useSyncExternalStore(store.subscribe, store.getEvents, store.getEvents);
}

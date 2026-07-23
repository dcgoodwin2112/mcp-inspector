import { EventLogSchema, type EventLog } from "../events";
import { denialSession } from "./denial-session";
import fullDemoJson from "./goldens/full-demo.json";

/** Recordings available in the Replay tab. First entry is the default. */
export const RECORDINGS: Array<{ id: string; label: string; log: EventLog }> = [
  {
    id: "full-demo",
    label: "Golden: full demo, beats 1–7 (recorded 2026-07-23)",
    log: EventLogSchema.parse(fullDemoJson),
  },
  {
    id: "denial-authored",
    label: "Authored sample: denial teaching moment",
    log: denialSession,
  },
];

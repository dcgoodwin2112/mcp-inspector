import {
  InspectorEventSchema,
  type EventLog,
  type InspectorEvent,
  type Actor,
} from "./events";

/**
 * Append-only event log store for LIVE mode. Assigns the envelope (id, seq,
 * t, wall, sessionId) and validates every event through the zod schema at
 * write time. The Timeline renders getEvents() directly — the same renderer
 * replay uses.
 */
export class EventLogStore {
  private events: InspectorEvent[] = [];
  private listeners = new Set<() => void>();
  private sessionId = "";
  private startedAtMs = 0;
  private seq = 0;

  getEvents = (): InspectorEvent[] => this.events;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** Reset and begin a new inspector session. Call before the first append. */
  start(sessionId: string): void {
    this.sessionId = sessionId;
    this.startedAtMs = Date.now();
    this.seq = 0;
    this.events = [];
    this.notify();
  }

  append(actor: Actor, body: Record<string, unknown>): InspectorEvent {
    this.seq += 1;
    const t = this.seq === 1 ? 0 : Math.max(0, Date.now() - this.startedAtMs);
    const candidate = {
      id: `evt-${String(this.seq).padStart(3, "0")}-${crypto.randomUUID().slice(0, 8)}`,
      seq: this.seq,
      t,
      wall: new Date(this.startedAtMs + t).toISOString(),
      sessionId: this.sessionId,
      actor,
      ...body,
    };
    const event = InspectorEventSchema.parse(candidate);
    this.events = [...this.events, event];
    this.notify();
    return event;
  }

  toEventLog(): EventLog {
    return {
      version: 2,
      sessionId: this.sessionId,
      recordedAt: new Date(this.startedAtMs).toISOString(),
      events: this.events,
    };
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }
}

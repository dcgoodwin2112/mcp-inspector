import type { EventLog } from "./events";

/**
 * Deterministic replay over an EventLog. Framework-free; React binds via
 * useSyncExternalStore. Playback timing multiplies deltas between event `t`
 * values by 1/speed. Annotations with pauseOnReplay auto-pause after being
 * revealed. Live mode reuses the same renderer — this controller is
 * replay-only machinery.
 */

export interface ReplayState {
  /** Number of events currently visible (renderer shows events.slice(0, cursor)). */
  cursor: number;
  playing: boolean;
  speed: number;
}

export const SPEEDS = [0.5, 1, 2, 4] as const;

/**
 * Longest recorded gap playback will actually wait out. Recordings capture
 * real presenter idle time between beats (reading a model answer, setting up
 * the next step — 20-48s stretches in the golden); replay compresses those
 * while leaving realistic sub-cap latencies untouched. Applied before the
 * speed division, so 2× still halves the wait.
 */
export const MAX_STEP_DELAY_MS = 3000;

export class ReplayController {
  private state: ReplayState = { cursor: 0, playing: false, speed: 1 };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();

  constructor(readonly log: EventLog) {}

  getState = (): ReplayState => this.state;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  get total(): number {
    return this.log.events.length;
  }

  /** t (ms) of the most recently revealed event, for the progress clock. */
  get currentT(): number {
    const { cursor } = this.state;
    return cursor === 0 ? 0 : this.log.events[cursor - 1].t;
  }

  play(): void {
    if (this.state.playing) return;
    // Play at the end restarts — presenter-friendly.
    const cursor = this.state.cursor >= this.total ? 0 : this.state.cursor;
    this.setState({ cursor, playing: true });
    this.scheduleNext();
  }

  pause(): void {
    this.clearTimer();
    if (this.state.playing) this.setState({ playing: false });
  }

  toggle(): void {
    if (this.state.playing) this.pause();
    else this.play();
  }

  /** Step one event; with `skip`, keep going past events hidden from the
   *  timeline (e.g. rpc frames when raw-frames view is off) so a step is never a
   *  visible no-op. */
  stepForward(skip?: (e: import("./events").InspectorEvent) => boolean): void {
    this.pause();
    do {
      if (this.state.cursor >= this.total) return;
      this.advance();
    } while (
      skip !== undefined &&
      this.state.cursor < this.total &&
      skip(this.log.events[this.state.cursor - 1])
    );
  }

  stepBack(skip?: (e: import("./events").InspectorEvent) => boolean): void {
    this.pause();
    let cursor = this.state.cursor;
    do {
      if (cursor <= 0) break;
      cursor -= 1;
    } while (skip !== undefined && cursor > 0 && skip(this.log.events[cursor - 1]));
    this.setState({ cursor });
  }

  restart(): void {
    this.pause();
    this.setState({ cursor: 0 });
  }

  seekEnd(): void {
    this.pause();
    this.setState({ cursor: this.total });
  }

  setSpeed(speed: number): void {
    this.setState({ speed });
    if (this.state.playing) {
      this.clearTimer();
      this.scheduleNext();
    }
  }

  dispose(): void {
    this.clearTimer();
    this.listeners.clear();
  }

  private scheduleNext(): void {
    const { cursor, speed } = this.state;
    if (cursor >= this.total) {
      this.setState({ playing: false });
      return;
    }
    const prevT = cursor === 0 ? 0 : this.log.events[cursor - 1].t;
    const delta = Math.max(0, this.log.events[cursor].t - prevT);
    const delay = Math.min(delta, MAX_STEP_DELAY_MS) / speed;
    this.timer = setTimeout(() => this.advance(), delay);
  }

  /** Reveal the next event; honor pauseOnReplay; keep playing otherwise. */
  private advance(): void {
    const next = this.log.events[this.state.cursor];
    const cursor = this.state.cursor + 1;
    const hitPause = next.type === "annotation" && next.pauseOnReplay === true;
    const atEnd = cursor >= this.total;
    const playing = this.state.playing && !hitPause && !atEnd;
    this.clearTimer();
    this.setState({ cursor, playing });
    if (playing) this.scheduleNext();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private setState(patch: Partial<ReplayState>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn();
  }
}

import type { Actor, Primitive } from "./events";

/** Actor → "who's driving?" badge styling. Consistent across the whole UI. */
export const ACTOR_STYLES: Record<Actor, { label: string; badge: string; dot: string }> = {
  user: {
    label: "user",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  model: {
    label: "model",
    badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
  app: {
    label: "app",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  server: {
    label: "server",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    dot: "bg-orange-500",
  },
};

/** Primitive → accent styling. The color-coding taught by the capability panel. */
export const PRIMITIVE_STYLES: Record<Primitive, { label: string; border: string; text: string }> = {
  tool: {
    label: "tool",
    border: "border-l-cyan-500",
    text: "text-cyan-700 dark:text-cyan-400",
  },
  resource: {
    label: "resource",
    border: "border-l-indigo-500",
    text: "text-indigo-700 dark:text-indigo-400",
  },
  prompt: {
    label: "prompt",
    border: "border-l-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
};

/** 92500 → "1:32.5" */
export function formatClock(t: number): string {
  const totalSeconds = t / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

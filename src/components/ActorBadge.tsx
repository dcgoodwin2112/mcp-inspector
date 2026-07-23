import type { Actor } from "@/lib/events";
import { ACTOR_STYLES } from "@/lib/ui";

/** The "who's driving?" badge — the core pedagogical element. */
export function ActorBadge({ actor }: { actor: Actor }) {
  const s = ACTOR_STYLES[actor];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

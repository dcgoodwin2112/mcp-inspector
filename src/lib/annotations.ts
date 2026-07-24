/**
 * Chips derived from MCP tool annotations (readOnlyHint, destructiveHint,
 * idempotentHint, openWorldHint). Annotations are ADVISORY metadata for
 * hosts — the spec forbids treating them as security; the server's
 * permission filtering is the real enforcement.
 */

export type ChipTone = "read" | "danger" | "caution";

export interface AnnotationChip {
  label: string;
  tone: ChipTone;
}

export function annotationChips(annotations?: Record<string, unknown>): AnnotationChip[] {
  if (!annotations) return [];
  const chips: AnnotationChip[] = [];
  if (annotations.readOnlyHint === true) chips.push({ label: "read-only", tone: "read" });
  if (annotations.destructiveHint === true) chips.push({ label: "destructive", tone: "danger" });
  if (annotations.idempotentHint === false) {
    chips.push({ label: "non-idempotent", tone: "caution" });
  }
  if (annotations.openWorldHint === true) chips.push({ label: "open-world", tone: "caution" });
  return chips;
}

/**
 * Tool-level (in-band) failure detection. dkan_query_tools returns structured
 * `{ error: … }` payloads inside a NORMAL protocol success instead of
 * throwing — MCP's own isError flag is the spec's variant of the same
 * channel. Both mean: the model sees the failure and can react.
 */
export function inBandError(result: unknown): string | undefined {
  const sc = (result as { structuredContent?: { error?: unknown } } | undefined)
    ?.structuredContent;
  return typeof sc?.error === "string" ? sc.error : undefined;
}

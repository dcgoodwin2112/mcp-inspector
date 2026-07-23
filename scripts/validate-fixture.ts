/**
 * Validates the golden fixture against EventLogSchema (parse happens at
 * import) and prints a summary. Exits non-zero on any validation failure.
 */
async function main() {
  const { denialSession } = await import("../src/lib/fixtures/denial-session");

  const byType = new Map<string, number>();
  for (const e of denialSession.events) {
    byType.set(e.type, (byType.get(e.type) ?? 0) + 1);
  }
  const last = denialSession.events[denialSession.events.length - 1];

  console.log(`✓ fixture valid: ${denialSession.sessionId}`);
  console.log(`  events: ${denialSession.events.length}, duration: ${(last.t / 1000).toFixed(1)}s`);
  for (const [type, n] of [...byType.entries()].sort()) {
    console.log(`  ${String(n).padStart(3)} ${type}`);
  }
}

main().catch((err) => {
  console.error("✗ fixture INVALID");
  console.error(err);
  process.exit(1);
});

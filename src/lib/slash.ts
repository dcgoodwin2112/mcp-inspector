import type { CapabilityItem } from "./events";

/**
 * Pure logic behind the chat box's inline slash commands — parsing, command
 * matching, argument state, and suggestion acceptance. AgentChat binds these
 * to input state; kept framework-free so they are unit-testable.
 */

export interface PromptArg {
  name: string;
  description?: string;
  required?: boolean;
}

export interface SlashParse {
  name: string;
  /** Text after the command; null until the first space is typed. */
  rest: string | null;
}

export function parseSlash(text: string): SlashParse | null {
  if (!text.startsWith("/")) return null;
  const space = text.indexOf(" ");
  if (space === -1) return { name: text.slice(1), rest: null };
  return { name: text.slice(1, space), rest: text.slice(space + 1) };
}

/** Command-picker matches — only while the command itself is being typed. */
export function matchCommands(
  slash: SlashParse | null,
  prompts: CapabilityItem[],
): CapabilityItem[] {
  if (!slash || slash.rest !== null) return [];
  const q = slash.name.toLowerCase();
  return prompts.filter(
    (p) => p.name.toLowerCase().includes(q) || p.name.replace(/_/g, "-").includes(q),
  );
}

export interface ArgState {
  /** Argument values parsed so far, keyed by argument name. */
  map: Record<string, string>;
  /** The argument the trailing token targets (for the hint line). */
  currentArg?: PromptArg;
  /** Value text of the token being typed (after any `name=`). */
  currentValue: string;
  requiredFilled: boolean;
}

/** Parse the text after the command: positional or key=value tokens. */
export function computeArgState(rest: string, argDefs: PromptArg[]): ArgState {
  const tokens = rest.trim() === "" ? [] : rest.trim().split(/\s+/);
  const typingNew = rest === "" || /\s$/.test(rest);
  const map: Record<string, string> = {};
  let positional = 0;
  for (const tok of tokens) {
    const eq = tok.indexOf("=");
    if (eq > 0) {
      map[tok.slice(0, eq)] = tok.slice(eq + 1);
    } else {
      const def = argDefs[positional];
      if (def) map[def.name] = tok;
      positional += 1;
    }
  }
  const currentToken = typingNew ? "" : (tokens[tokens.length - 1] ?? "");
  let currentArg: PromptArg | undefined;
  let currentValue = currentToken;
  const eq = currentToken.indexOf("=");
  if (eq > 0) {
    currentArg = argDefs.find((a) => a.name === currentToken.slice(0, eq));
    currentValue = currentToken.slice(eq + 1);
  } else {
    const idx = typingNew ? tokens.length : tokens.length - 1;
    currentArg = argDefs[Math.max(0, Math.min(idx, argDefs.length - 1))];
  }
  const requiredFilled = argDefs
    .filter((a) => a.required)
    .every((a) => (map[a.name] ?? "").trim() !== "");
  return { map, currentArg, currentValue, requiredFilled };
}

/** Replace the token being typed with an accepted suggestion. */
export function acceptValueText(text: string, v: string): string {
  const space = text.indexOf(" ");
  const head = text.slice(0, space + 1);
  const rest = text.slice(space + 1);
  if (rest === "" || /\s$/.test(rest)) return head + rest + v;
  const toks = rest.split(/\s+/);
  const last = toks[toks.length - 1];
  const eq = last.indexOf("=");
  toks[toks.length - 1] = eq > 0 ? last.slice(0, eq + 1) + v : v;
  return head + toks.join(" ");
}

/**
 * Auto-generate manual-mode form fields from a tool's JSON inputSchema.
 * Handles DKAN's string-typed JSON args (metadata, conditions, …) as
 * textareas; values are coerced back to schema types on submit.
 */

export interface FieldSpec {
  name: string;
  type: "string" | "number" | "integer" | "boolean";
  required: boolean;
  description?: string;
  enumValues?: string[];
  /** String field that carries a JSON document — render as textarea. */
  jsonText: boolean;
  defaultValue?: string;
}

interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

interface JsonSchemaObject {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

const JSON_TEXT_FIELDS = new Set(["metadata", "conditions", "expressions", "groupings", "columns"]);

export function fieldsFromSchema(schema: unknown): FieldSpec[] {
  const s = schema as JsonSchemaObject | undefined;
  if (!s?.properties) return [];
  const required = new Set(s.required ?? []);
  return Object.entries(s.properties).map(([name, prop]) => {
    const type =
      prop.type === "integer" || prop.type === "number" || prop.type === "boolean"
        ? prop.type
        : "string";
    return {
      name,
      type,
      required: required.has(name),
      description: prop.description,
      enumValues: prop.enum?.map(String),
      jsonText:
        type === "string" &&
        (JSON_TEXT_FIELDS.has(name) || /\bJSON\b/i.test(prop.description ?? "")),
      defaultValue: prop.default !== undefined ? String(prop.default) : undefined,
    };
  });
}

/** Coerce raw form values (strings/booleans) to schema types; omit empties. */
export function coerceValues(
  fields: FieldSpec[],
  values: Record<string, string | boolean>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "boolean") {
      if (v === true) out[f.name] = true;
      continue;
    }
    if (typeof v !== "string" || v.trim() === "") continue;
    if (f.type === "integer" || f.type === "number") {
      const n = Number(v);
      if (!Number.isNaN(n)) out[f.name] = n;
    } else {
      out[f.name] = v;
    }
  }
  return out;
}

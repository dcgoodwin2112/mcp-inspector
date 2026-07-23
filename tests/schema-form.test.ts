import { describe, expect, it } from "vitest";
import { coerceValues, fieldsFromSchema } from "@/lib/schema-form";

const SCHEMA = {
  type: "object",
  properties: {
    keyword: { type: "string", description: "Search keyword" },
    page: { type: "integer", description: "Result page", default: 1 },
    limit: { type: "number" },
    published: { type: "boolean" },
    metadata: { type: "string", description: "Dataset metadata" },
    conditions: { type: "string" },
    filter: { type: "string", description: "A JSON document of filters" },
    sort: { type: "string", enum: ["asc", "desc"] },
  },
  required: ["keyword"],
};

describe("fieldsFromSchema", () => {
  const fields = fieldsFromSchema(SCHEMA);
  const byName = Object.fromEntries(fields.map((f) => [f.name, f]));

  it("returns [] for missing or shapeless schemas", () => {
    expect(fieldsFromSchema(undefined)).toEqual([]);
    expect(fieldsFromSchema({})).toEqual([]);
  });

  it("maps types and required flags", () => {
    expect(byName.keyword).toMatchObject({ type: "string", required: true });
    expect(byName.page).toMatchObject({ type: "integer", required: false, defaultValue: "1" });
    expect(byName.limit.type).toBe("number");
    expect(byName.published.type).toBe("boolean");
  });

  it("flags JSON-document string fields for textarea rendering", () => {
    expect(byName.metadata.jsonText).toBe(true); // known DKAN field name
    expect(byName.conditions.jsonText).toBe(true);
    expect(byName.filter.jsonText).toBe(true); // "JSON" in the description
    expect(byName.keyword.jsonText).toBe(false);
  });

  it("stringifies enum values", () => {
    expect(byName.sort.enumValues).toEqual(["asc", "desc"]);
  });
});

describe("coerceValues", () => {
  const fields = fieldsFromSchema(SCHEMA);

  it("coerces numbers and integers, drops unparseable ones", () => {
    expect(coerceValues(fields, { page: "2", limit: "1.5" })).toEqual({ page: 2, limit: 1.5 });
    expect(coerceValues(fields, { page: "abc" })).toEqual({});
  });

  it("keeps only true booleans", () => {
    expect(coerceValues(fields, { published: true })).toEqual({ published: true });
    expect(coerceValues(fields, { published: false })).toEqual({});
  });

  it("omits empty and whitespace-only strings", () => {
    expect(coerceValues(fields, { keyword: "", metadata: "   " })).toEqual({});
    expect(coerceValues(fields, { keyword: "bike lanes" })).toEqual({ keyword: "bike lanes" });
  });
});

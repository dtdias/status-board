import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const migration = readFileSync(resolve(root, "supabase/migrations/0011_fix_presentation_finalize_ambiguity.sql"), "utf8");

describe("presentation finalize migration", () => {
  it("qualifies presentation ids inside the finalize RPC", () => {
    expect(migration).toContain("from public.generated_presentations as gp");
    expect(migration).toContain("where gp.id = target_presentation_id");
    expect(migration).toContain("and gp.id <> target_presentation_id");
    expect(migration).not.toMatch(/where weekly_report_id = target_report_id\s+and id <> target_presentation_id/);
  });

  it("does not expire legacy presentations without a recipe", () => {
    expect(migration).toContain("and gp.input_snapshot is not null");
  });
});

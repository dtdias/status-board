import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const envModule = readFileSync(resolve(root, "lib/supabase/env.ts"), "utf8");

describe("Supabase environment contract", () => {
  it("keeps credentials server-only and outside the browser bundle", () => {
    expect(envModule).toContain('import "server-only"');
    expect(envModule).toContain("process.env.SUPABASE_URL");
    expect(envModule).toContain("process.env.SUPABASE_PUBLISHABLE_KEY");
    expect(envModule).not.toContain("NEXT_PUBLIC_SUPABASE");
  });
});

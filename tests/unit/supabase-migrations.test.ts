import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = resolve(import.meta.dirname, "../../supabase/migrations");

describe("Supabase migrations", () => {
  it("keeps migration files consecutively numbered", () => {
    const versions = readdirSync(migrationDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => Number(file.slice(0, 4)));

    expect(versions).toEqual(versions.map((_, index) => index + 1));
  });
});

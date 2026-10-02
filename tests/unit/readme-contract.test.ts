import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const readmeEnglish = readFileSync(resolve(root, "README.en.md"), "utf8");

describe("README contract", () => {
  it("keeps both language versions and localized editorial heroes available", () => {
    expect(existsSync(resolve(root, "docs/assets/readme-hero-pt.svg"))).toBe(true);
    expect(existsSync(resolve(root, "docs/assets/readme-hero-en.svg"))).toBe(true);
    expect(readme).toContain("README.en.md");
    expect(readmeEnglish).toContain("README.md");
    expect(readme).toContain("docs/assets/readme-hero-pt.svg");
    expect(readmeEnglish).toContain("docs/assets/readme-hero-en.svg");
  });

  it("documents the server-only Supabase environment contract", () => {
    expect(readme).toContain("SUPABASE_URL");
    expect(readme).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(readme).not.toContain("NEXT_PUBLIC_SUPABASE");
  });
});

import { existsSync, readFileSync, statSync } from "node:fs";
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

  it.each(["pt", "en"])("keeps the %s hero accessible, vector-only and lightweight", (lang) => {
    const file = resolve(root, `docs/assets/readme-hero-${lang}.svg`);
    const svg = readFileSync(file, "utf8");

    expect(svg).toContain('viewBox="0 0 1400 420"');
    expect(svg).toContain('role="img"');
    expect(svg).toMatch(/<title id="title">[^<]+<\/title>/);
    expect(svg).toMatch(/<desc id="description">[^<]+<\/desc>/);
    expect(svg).not.toMatch(/<image\b/);
    expect(svg).not.toContain("@font-face");
    expect(svg).not.toContain("Arial Bold");
    expect(statSync(file).size).toBeLessThan(40 * 1024);
  });

  it("versions the editable VectorCraft source of the hero", () => {
    expect(existsSync(resolve(root, "design/readme-hero/readme-hero.vectorcraft"))).toBe(true);
  });

  it("documents the server-only Supabase environment contract", () => {
    expect(readme).toContain("SUPABASE_URL");
    expect(readme).toContain("SUPABASE_PUBLISHABLE_KEY");
    expect(readme).not.toContain("NEXT_PUBLIC_SUPABASE");
  });
});

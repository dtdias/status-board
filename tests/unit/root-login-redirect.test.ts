import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const homePage = readFileSync(resolve(root, "app/page.tsx"), "utf8");

describe("root route access", () => {
  it("redirects visitors to login instead of rendering the public board mock", () => {
    expect(homePage).toContain('redirect("/login" as Route)');
    expect(homePage).not.toContain("Status semanal");
  });
});

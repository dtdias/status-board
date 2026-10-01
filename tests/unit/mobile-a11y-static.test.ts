import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const styles = readFileSync(resolve(root, "app/globals.css"), "utf8");
const preview = readFileSync(resolve(root, "components/preview/report-preview.tsx"), "utf8");

describe("mobile accessibility safeguards", () => {
  it("keeps a visible focus treatment and honors reduced motion", () => {
    expect(styles).toContain("button:focus-visible, a:focus-visible");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps preview slides at 16:9 by allowing narrow screens to scroll", () => {
    expect(styles).toContain(".preview-canvas { overflow-x: auto;");
    expect(styles).toContain(".slide { min-width: 600px; }");
    expect(styles).not.toContain(".slide { aspect-ratio: auto;");
  });

  it("uses the tab pattern for slide navigation with arrow-key support", () => {
    expect(preview).toContain('role="tablist"');
    expect(preview).toContain('role="tabpanel"');
    expect(preview).toContain('event.key === "ArrowRight"');
  });

  it("renders template icon assets instead of icon-key initials", () => {
    expect(preview).toContain("<ReportIcon");
    expect(preview).not.toContain("iconKey[0]");
    expect(preview).not.toContain("iconKey[0]?.toUpperCase()");
  });
});

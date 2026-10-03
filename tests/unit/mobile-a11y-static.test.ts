import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const styles = readFileSync(resolve(root, "app/globals.css"), "utf8");
const preview = readFileSync(resolve(root, "components/preview/pptx-file-preview.tsx"), "utf8");
const reportIcon = readFileSync(resolve(root, "components/report-icon.tsx"), "utf8");
const reportPage = readFileSync(resolve(root, "app/app/reports/[reportId]/page.tsx"), "utf8");
const reportActions = readFileSync(resolve(root, "app/app/reports/[reportId]/report-status-actions.tsx"), "utf8");

describe("mobile accessibility safeguards", () => {
  it("keeps a visible focus treatment and honors reduced motion", () => {
    expect(styles).toContain("button:focus-visible, a:focus-visible");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps rendered PPTX slides scrollable in the preview viewport", () => {
    expect(styles).toContain(".pptx-render-viewport");
    expect(styles).toContain("overflow: auto");
  });

  it("renders the actual PPTX in-browser with accessible slide controls", () => {
    expect(preview).toContain('aria-label="Navegação dos slides"');
    expect(preview).toContain("goToSlide");
    expect(preview).toContain("@aiden0z/pptx-renderer");
    expect(preview).toContain("RECOMMENDED_ZIP_LIMITS");
  });

  it("renders template icon assets instead of icon-key initials", () => {
    expect(reportIcon).toContain("reportIconPath(iconKey)");
    expect(reportIcon).toContain('alt=""');
  });

  it("keeps report actions grouped without nested action containers", () => {
    expect(reportPage).toContain("className=\"report-actions\"");
    expect(reportActions).toContain("className=\"action-group report-status-actions\"");
    expect(reportPage).not.toContain("<BrandLogo");
  });

  it("provides the branded application icon and button hover feedback", () => {
    expect(readFileSync(resolve(root, "app/icon.svg"), "utf8")).toContain("#FFD400");
    expect(styles).toContain(".outline-button:hover");
    expect(styles).toContain(".primary-button:hover");
  });
});

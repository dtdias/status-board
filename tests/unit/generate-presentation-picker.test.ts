import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GeneratePresentation } from "@/app/app/reports/[reportId]/generate-presentation";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function render(props: Partial<Parameters<typeof GeneratePresentation>[0]> = {}) {
  return renderToStaticMarkup(createElement(GeneratePresentation, { reportId: "report-1", ...props }));
}

describe("GeneratePresentation theme picker", () => {
  it("keeps the tour target on the trigger and renders an accessible modal dialog", () => {
    const html = render();
    expect(html).toContain('data-tour="generate-pptx"');
    expect(html).toContain("Gerar PowerPoint");
    expect(html).toContain("<dialog");
    expect(html).toContain('aria-labelledby="theme-picker-title"');
    expect(html).toContain('aria-describedby="theme-picker-hint"');
    expect(html).toContain("Gerar com este tema");
    expect(html).toContain("Cancelar");
  });

  it("offers only the available themes, one radio each, with the saved theme pre-selected", () => {
    const html = render({ availableThemes: ["base", "navy-corporate", "warm-terracotta"], defaultTheme: "navy-corporate" });
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toContain('value="navy-corporate"');
    expect(html).not.toContain('value="light-minimal"');
    expect(html).toMatch(/checked=""[^>]*value="navy-corporate"|value="navy-corporate"[^>]*checked=""/);
    expect(html.match(/checked=""/g)).toHaveLength(1);
  });

  it("falls back to base when the saved theme is no longer published", () => {
    const html = render({ availableThemes: ["base"], defaultTheme: "warm-terracotta" });
    expect(html.match(/type="radio"/g)).toHaveLength(1);
    expect(html).toMatch(/checked=""[^>]*value="base"|value="base"[^>]*checked=""/);
  });

  it("links a per-theme preview that opens in a new tab", () => {
    const html = render({ availableThemes: ["base", "light-minimal"] });
    expect(html).toContain('href="/app/reports/report-1/preview?theme=light-minimal"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });
});

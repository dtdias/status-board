import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BoardTabs } from "../../app/app/reports/[reportId]/board-tabs";

const tabs = [
  { id: "deliveries", label: "Entregas" },
  { id: "incidents", label: "Incidentes" },
  { id: "demands", label: "Demandas" },
  { id: "support", label: "Sustentação" },
  { id: "attention", label: "Atenção" },
];

describe("BoardTabs", () => {
  it("associates every tab with its panel using ARIA", () => {
    const markup = renderToStaticMarkup(createElement(
      BoardTabs,
      {
        tabs,
        children: tabs.map((tab) => createElement("article", { key: tab.id }, tab.label)),
      },
    ));

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-orientation="horizontal"');
    expect(markup.match(/role="tab"/g)).toHaveLength(tabs.length);
    expect(markup.match(/role="tabpanel"/g)).toHaveLength(tabs.length);

    for (const tab of tabs) {
      expect(markup).toContain(`id="report-board-tab-${tab.id}"`);
      expect(markup).toContain(`aria-controls="report-board-panel-${tab.id}"`);
      expect(markup).toContain(`id="report-board-panel-${tab.id}"`);
      expect(markup).toContain(`aria-labelledby="report-board-tab-${tab.id}"`);
    }
  });

  it("supports roving keyboard navigation", () => {
    const sourceText = readFileSync(resolve(import.meta.dirname, "../../app/app/reports/[reportId]/board-tabs.tsx"), "utf8");

    expect(sourceText).toContain('event.key === "ArrowRight"');
    expect(sourceText).toContain('event.key === "ArrowLeft"');
    expect(sourceText).toContain('event.key === "Home"');
    expect(sourceText).toContain('event.key === "End"');
  });
});

import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Route } from "next";
import { BoardColumn } from "../../app/app/reports/[reportId]/board-column";

vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: ReactNode }) =>
    createElement("a", { href, className }, children),
}));

const columns = [
  { title: "Entregas", headingId: "deliveries-heading", statusClassName: "green", countLabel: "entregas", emptyMessage: "Sem ocorrências", addHref: "/app/reports/report-1/deliveries/new", addLabel: "Adicionar entrega" },
  { title: "Incidentes", headingId: "incidents-heading", statusClassName: "red", countLabel: "incidentes", emptyMessage: "Sem incidentes", addHref: "/app/reports/report-1/incidents/new", addLabel: "Adicionar incidente" },
  { title: "Demandas", headingId: "demands-heading", statusClassName: "yellow", countLabel: "demandas", emptyMessage: "Sem ocorrências", addHref: "/app/reports/report-1/demands/new", addLabel: "Adicionar demanda" },
  { title: "Sustentação", headingId: "support-heading", statusClassName: "blue", countLabel: "frentes", emptyMessage: "Sem ocorrências", addHref: "/app/reports/report-1/support-fronts/new", addLabel: "Adicionar frente" },
] as const;

function renderColumn(column: (typeof columns)[number], count: number) {
  const children = count > 0
    ? createElement("div", { className: "delivery-stack" },
      ...Array.from({ length: count }, (_, index) => createElement("p", { key: index }, `Card ${index + 1}`)))
    : undefined;

  return renderToStaticMarkup(createElement(BoardColumn, {
    ...column,
    count,
    countLabel: `${count} ${column.countLabel}`,
    addHref: column.addHref as Route,
    children,
  }));
}

describe("BoardColumn add action", () => {
  it.each(columns)("keeps $addLabel visible when $title is empty", (column) => {
    const markup = renderColumn(column, 0);

    expect(markup).toContain(`href="${column.addHref}"`);
    expect(markup).toContain(`>${column.addLabel}</a>`);
    expect(markup).toContain(column.emptyMessage);
  });

  it.each(columns)("keeps $addLabel after existing $title cards", (column) => {
    const markup = renderColumn(column, 2);

    expect(markup).toContain(`href="${column.addHref}"`);
    expect(markup).toContain("Card 1");
    expect(markup).toContain("Card 2");
    expect(markup.indexOf("Card 2")).toBeLessThan(markup.indexOf(`>${column.addLabel}</a>`));
  });

  it("renders each column as an initially open native disclosure", () => {
    const markup = renderColumn(columns[0], 0);

    expect(markup).toContain("<details");
    expect(markup).toContain(" open");
    expect(markup).toContain('<summary class="column-heading">');
    expect(markup).toContain('id="deliveries-heading"');
  });
});

import { describe, expect, it } from "vitest";
import { composePreviewSlides, findPreviewOverflow, type PreviewInput } from "@/lib/preview/compose-slides";

const input: PreviewInput = {
  report: { id: "report", name: "João", area: "Tecnologia", startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Entrega ERP" },
  deliveries: Array.from({ length: 5 }, (_, index) => ({ id: `delivery-${index}`, title: "Entrega", description: "Descrição", status: "delivered" as const, iconKey: "integration" })),
  incidents: Array.from({ length: 3 }, (_, index) => ({ id: `incident-${index}`, affectedSystem: "ERP", symptom: "Falha", cause: null, actionTaken: "Corrigido", supportPeople: null, status: "resolved" as const, resolvedAt: "2026-09-23", iconKey: "incident" })),
  demands: Array.from({ length: 2 }, (_, index) => ({ id: `demand-${index}`, title: "Nova demanda", requesterName: "Ana", requesterArea: "Comercial", involvedAreas: ["TI"], objective: "Automatizar", statusText: "Em análise", currentPhase: "development" as const, iconKey: "demand" })),
  supportFronts: Array.from({ length: 3 }, (_, index) => ({ id: `support-${index}`, title: "Monitoramento", activityType: "Operação", iconKey: "routine", routines: [{ id: `routine-${index}`, title: "Verificar alertas" }] })),
  dependencies: [],
  nextSteps: [],
};

describe("composePreviewSlides", () => {
  it("keeps required section order and paginates content", () => {
    expect(composePreviewSlides(input).map((slide) => slide.kind)).toEqual(["cover", "summary", "deliveries", "deliveries", "incidents", "incidents", "demand", "demand", "support", "support", "attention"]);
  });

  it("retains empty sections as one slide", () => {
    const slides = composePreviewSlides({ ...input, deliveries: [], incidents: [], demands: [], supportFronts: [] });
    expect(slides.filter((slide) => slide.kind === "deliveries")).toHaveLength(1);
    expect(slides.filter((slide) => slide.kind === "incidents")).toHaveLength(1);
    expect(slides.filter((slide) => slide.kind === "demand")).toHaveLength(1);
    expect(slides.filter((slide) => slide.kind === "support")).toHaveLength(1);
  });

  it("flags fields over existing content limits", () => {
    expect(findPreviewOverflow({ ...input, deliveries: [{ ...input.deliveries[0], title: "x".repeat(61) }] })).toContainEqual({ section: "Entrega", entityId: "delivery-0", field: "Título", limit: 60 });
  });
});

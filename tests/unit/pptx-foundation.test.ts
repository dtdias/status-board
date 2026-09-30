import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { composePresentationSections, demandPhaseColors, presentationFileName, presentationSummary, statusColors } from "@/lib/pptx/compose";
import { assertPptxIntegrity, assertTemplateIntegrity } from "@/lib/pptx/integrity";
import { generatedPresentationPath, nextPresentationVersion } from "@/lib/storage/generated-presentation";
import type { PresentationInput } from "@/lib/pptx/types";

function input(): PresentationInput {
  return {
    report: { id: "report-1", name: "João Silva", area: "Tecnologia", startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Entrega principal" },
    deliveries: Array.from({ length: 5 }, (_, index) => ({ id: `delivery-${index}`, title: "Entrega", description: "Descrição", status: "delivered" as const, iconKey: "integration", position: index })),
    incidents: Array.from({ length: 3 }, (_, index) => ({ id: `incident-${index}`, affectedSystem: "ERP", symptom: "Erro", cause: null, actionTaken: "Corrigido", supportPeople: null, status: "resolved" as const, resolvedAt: "2026-09-22", iconKey: "incident", position: index })),
    demands: Array.from({ length: 2 }, (_, index) => ({ id: `demand-${index}`, title: "Demanda", requesterName: "Ana", requesterArea: "Comercial", involvedAreas: ["TI"], objective: "Objetivo", statusText: "Em análise", currentPhase: "development" as const, iconKey: "demand", position: index })),
    supportFronts: Array.from({ length: 3 }, (_, index) => ({ id: `support-${index}`, title: "Suporte", activityType: "Monitoramento", iconKey: "routine", position: index, routines: [{ id: `routine-${index}`, title: "Rotina", position: 0 }] })),
    dependencies: [],
    nextSteps: [],
  };
}

describe("PPTX composition", () => {
  it("keeps required order and paginates to the 11-slide integration fixture", () => {
    expect(composePresentationSections(input())).toEqual(["cover", "summary", "deliveries", "deliveries", "incidents", "incidents", "demands", "demands", "support", "support", "attention"]);
  });

  it("calculates summary from report content and creates a safe filename", () => {
    expect(presentationSummary(input())).toEqual({ deliveries: 5, resolvedIncidents: 3, newDemands: 2, supportRoutines: 3 });
    expect(presentationFileName(input())).toBe("Status Semanal - João Silva - 21-09 a 27-09.pptx");
  });

  it("uses PRD status and demand phase colors", () => {
    expect(statusColors.blocked).toBe("#D7191C");
    expect(demandPhaseColors("development")).toEqual(["#2E8B57", "#2E8B57", "#FFD400", "#A6A6A6"]);
  });
});

describe("generated presentation storage", () => {
  it("uses an immutable, user-scoped path for each version", () => {
    expect(generatedPresentationPath("user-1", "report-1", 3)).toBe("user-1/report-1/v3.pptx");
  });

  it("selects the next version after the current highest version", () => {
    expect(nextPresentationVersion([])).toBe(1);
    expect(nextPresentationVersion([1, 3, 2])).toBe(4);
  });
});

describe("PPTX ZIP integrity", () => {
  it("accepts a PPTX archive with presentation and slide XML", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", "<Types />");
    zip.file("ppt/presentation.xml", "<p:presentation><p:sldIdLst><p:sldId /></p:sldIdLst></p:presentation>");
    zip.file("ppt/slides/slide1.xml", "<p:sld />");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    await expect(assertPptxIntegrity(buffer, 1)).resolves.toMatchObject({ slideCount: 1 });
  });

  it("rejects templates without all mapped slides", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", "<Types />");
    zip.file("ppt/presentation.xml", "<p:presentation><p:sldIdLst><p:sldId /></p:sldIdLst></p:presentation>");
    zip.file("ppt/slides/slide1.xml", "<p:sld />");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    await expect(assertTemplateIntegrity(buffer)).rejects.toThrow("10 mapped slides");
  });

  it("rejects archives whose slide XML parts do not match the presentation", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", "<Types />");
    zip.file("ppt/presentation.xml", "<p:presentation><p:sldIdLst><p:sldId /></p:sldIdLst></p:presentation>");
    zip.file("ppt/slides/slide1.xml", "<p:sld />");
    zip.file("ppt/slides/slide2.xml", "<p:sld />");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    await expect(assertPptxIntegrity(buffer, 1)).rejects.toThrow("slide XML parts do not match");
  });

  it("rejects archives missing required PPTX parts", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", "<Types />");
    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    await expect(assertPptxIntegrity(buffer)).rejects.toThrow("missing required PPTX XML parts");
  });
});

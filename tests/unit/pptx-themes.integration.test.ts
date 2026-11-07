import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { generatePptx } from "@/lib/pptx/generate";
import { assertPptxIntegrity } from "@/lib/pptx/integrity";
import type { PresentationInput } from "@/lib/pptx/types";
import { PRESENTATION_THEMES } from "@/lib/pptx/themes";

// Source file of every theme: the approved master plus its colour/typography variations.
const themeFiles: Record<string, string> = {
  base: "template-base.pptx",
  "navy-corporate": "navy-corporate.pptx",
  "light-minimal": "light-minimal.pptx",
  "graphite-emerald": "graphite-emerald.pptx",
  "warm-terracotta": "warm-terracotta.pptx",
};

function themePath(id: string) {
  return resolve(process.cwd(), "design/template-variations", themeFiles[id]);
}

function fixture(): PresentationInput {
  return {
    report: { id: "report-theme", name: "Theme Check", area: "Technology", startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Theme highlight" },
    deliveries: Array.from(["delivered", "in_progress", "waiting_third_party", "blocked", "delivered"] as const, (status, index) => ({ id: `delivery-${index}`, title: `Delivery fixture ${index + 1}`, description: `Delivery description ${index + 1}`, status, iconKey: "integration", position: index })),
    incidents: Array.from({ length: 3 }, (_, index) => ({ id: `incident-${index}`, affectedSystem: `Incident system ${index + 1}`, symptom: `Incident symptom ${index + 1}`, cause: null, actionTaken: `Incident action ${index + 1}`, supportPeople: null, status: "resolved" as const, resolvedAt: "2026-09-22", iconKey: "incident", position: index })),
    demands: Array.from({ length: 2 }, (_, index) => ({ id: `demand-${index}`, title: `Demand fixture ${index + 1}`, requesterName: "Fixture requester", requesterArea: "Commercial", involvedAreas: ["Technology"], objective: `Demand objective ${index + 1}`, statusText: "In analysis", currentPhase: "development" as const, iconKey: "demand", position: index })),
    supportFronts: Array.from({ length: 3 }, (_, index) => ({ id: `support-${index}`, title: `Support fixture ${index + 1}`, activityType: "Monitoring", iconKey: "routine", position: index, routines: [{ id: `routine-${index}`, title: `Support routine ${index + 1}`, position: 0 }] })),
    dependencies: [{ id: "dependency-0", title: "Acesso ERP", description: "Aguardando credencial.", owner: "Infra", waitingSince: "2026-09-21", status: null, hideOwnerInPresentation: false, hideWaitingSinceInPresentation: false, position: 0 }],
    nextSteps: [{ id: "step-0", title: "Publicar ajuste", description: "Após liberar acesso.", owner: "Tecnologia", dueDate: "2026-09-30", hideOwnerInPresentation: false, hideDueDateInPresentation: false, position: 0 }],
  };
}

function textFromXml(xml: string) {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1].replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">"));
}

describe("presentation theme catalog", () => {
  it("maps every catalog theme to a design file, a thumbnail and a distinct accent", () => {
    expect(PRESENTATION_THEMES.map((theme) => theme.id).sort()).toEqual(Object.keys(themeFiles).sort());
    expect(new Set(PRESENTATION_THEMES.map((theme) => theme.accent)).size).toBe(PRESENTATION_THEMES.length);
    for (const theme of PRESENTATION_THEMES) {
      expect(existsSync(themePath(theme.id)), `${theme.id} PPTX`).toBe(true);
      expect(existsSync(resolve(process.cwd(), "public", theme.thumbnail.replace(/^\//, ""))), `${theme.id} thumbnail`).toBe(true);
    }
  });
});

describe.each(PRESENTATION_THEMES.map((theme) => theme.id))("theme %s generates a valid presentation", (id) => {
  it("produces the 11-slide deck with real content, no placeholders and unique shape ids", async () => {
    const template = await readFile(themePath(id));
    const output = await generatePptx(fixture(), template);
    const zip = await JSZip.loadAsync(output, { checkCRC32: true });
    const integrity = await assertPptxIntegrity(output, 11);
    const slides = await Promise.all(integrity.slideFiles.map((path) => zip.file(path)!.async("string")));
    const text = slides.flatMap(textFromXml).join("\n");

    expect(integrity.slideFiles).toHaveLength(11);
    for (const expected of ["Theme highlight", "Delivery fixture 5", "Incident system 3", "Demand fixture 2", "Support fixture 3", "Acesso ERP", "Publicar ajuste"]) expect(text).toContain(expected);
    expect(text).not.toContain("[Nome da entrega]");
    expect(text).not.toContain("[Status]");
    expect(text).not.toMatch(/\{\{[^}]+\}\}|<%=?[^%]+%>|\$\{[^}]+\}/);
    for (const [index, xml] of slides.entries()) {
      const ids = [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size, `unique shape ids on generated slide ${index + 1}`).toBe(ids.length);
    }
  });
});

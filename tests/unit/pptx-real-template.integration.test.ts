import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { generatePptx } from "@/lib/pptx/generate";
import { assertPptxIntegrity } from "@/lib/pptx/integrity";
import type { PresentationInput } from "@/lib/pptx/types";

const templatePath = resolve(process.cwd(), "Template(1).pptx");
const hasMasterTemplate = existsSync(templatePath);

// This suite verifies generation against the reviewed master, not synthetic PPTX integrity.
// CI without that private file must report the missing integration coverage explicitly.
const describeRealTemplate = hasMasterTemplate ? describe : describe.skip;

function fixture(): PresentationInput {
  return {
    report: { id: "report-real-template", name: "Real Template", area: "Technology", startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Fixture highlight" },
    deliveries: Array.from({ length: 5 }, (_, index) => ({ id: `delivery-${index}`, title: `Delivery fixture ${index + 1}`, description: `Delivery description ${index + 1}`, status: "delivered" as const, iconKey: "integration", position: index })),
    incidents: Array.from({ length: 3 }, (_, index) => ({ id: `incident-${index}`, affectedSystem: `Incident system ${index + 1}`, symptom: `Incident symptom ${index + 1}`, cause: null, actionTaken: `Incident action ${index + 1}`, supportPeople: null, status: "resolved" as const, resolvedAt: "2026-09-22", iconKey: "incident", position: index })),
    demands: Array.from({ length: 2 }, (_, index) => ({ id: `demand-${index}`, title: `Demand fixture ${index + 1}`, requesterName: "Fixture requester", requesterArea: "Commercial", involvedAreas: ["Technology"], objective: `Demand objective ${index + 1}`, statusText: "In analysis", currentPhase: "development" as const, iconKey: "demand", position: index })),
    supportFronts: Array.from({ length: 3 }, (_, index) => ({ id: `support-${index}`, title: `Support fixture ${index + 1}`, activityType: "Monitoring", iconKey: "routine", position: index, routines: [{ id: `routine-${index}`, title: `Support routine ${index + 1}`, position: 0 }] })),
    dependencies: [],
    nextSteps: [],
  };
}

function textFromXml(xml: string) {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'"));
}

async function slideTexts(zip: JSZip, slideNumbers: number[]) {
  return (await Promise.all(slideNumbers.map(async (number) => {
    const slide = zip.file(`ppt/slides/slide${number}.xml`);
    if (!slide) throw new Error(`Missing slide ${number}.`);
    return textFromXml(await slide.async("string"));
  }))).flat();
}

describeRealTemplate(
  hasMasterTemplate
    ? "real PPTX template integration"
    : "real PPTX template integration (skipped: master template absent; no real-template integration coverage)",
  () => {
  it("generates the expected 11-slide presentation from Template(1).pptx", async () => {
    const template = await readFile(templatePath);
    const templateZip = await JSZip.loadAsync(template, { checkCRC32: true });
    const instructionTexts = await slideTexts(templateZip, [1, 2, 3]);
    const output = await generatePptx(fixture(), template);
    const zip = await JSZip.loadAsync(output, { checkCRC32: true });
    const integrity = await assertPptxIntegrity(output, 11);
    const text = (await slideTexts(zip, integrity.slideFiles.map((path) => Number(path.match(/slide(\d+)\.xml/)?.[1])))).join("\n");

    expect(zip.file("[Content_Types].xml")).toBeTruthy();
    expect(zip.file("ppt/presentation.xml")).toBeTruthy();
    expect(instructionTexts).not.toHaveLength(0);
    expect(integrity.slideFiles).toHaveLength(11);
    expect(text).toContain("Fixture highlight");
    expect(text).toContain("Delivery fixture 5");
    expect(text).toContain("Incident system 3");
    expect(text).toContain("Demand fixture 2");
    expect(text).toContain("Support fixture 3");
    expect(text).not.toMatch(/\{\{[^}]+\}\}|<%=?[^%]+%>|\$\{[^}]+\}/);
    expect(text).not.toContain("[Rotina / sistema acompanhado]");

    const corrupted = Buffer.from(output);
    corrupted[corrupted.length - 20] ^= 0x01;
    await expect(assertPptxIntegrity(corrupted, 11)).rejects.toThrow("valid PPTX ZIP archive");
  });
});

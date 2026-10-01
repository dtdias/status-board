import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { posix } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { generatePptx } from "@/lib/pptx/generate";
import { readTemplateIconMedia } from "@/lib/pptx/icons";
import { assertPptxIntegrity } from "@/lib/pptx/integrity";
import type { PresentationInput } from "@/lib/pptx/types";

const templatePath = resolve(process.cwd(), process.env.PPTX_REAL_TEMPLATE_PATH ?? "Template(1).pptx");
const hasMasterTemplate = existsSync(templatePath);

// This suite verifies generation against the reviewed master, not synthetic PPTX integrity.
// CI without that private file must report the missing integration coverage explicitly.
const describeRealTemplate = hasMasterTemplate ? describe : describe.skip;

if (!hasMasterTemplate) {
  process.stderr.write(`Skipping real PPTX template integration: master template absent at ${templatePath}; no real-template integration coverage.\n`);
}

function fixture(): PresentationInput {
  const deliveryIcons = ["integration", "database", "cloud", "process", "server"];
  const incidentIcons = ["incident", "blocked", "bug"];
  const supportIcons = ["routine", "network", "security"];
  return {
    report: { id: "report-real-template", name: "Real Template", area: "Technology", startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Fixture highlight" },
    deliveries: Array.from({ length: 5 }, (_, index) => ({ id: `delivery-${index}`, title: `Delivery fixture ${index + 1}`, description: `Delivery description ${index + 1}`, status: "delivered" as const, iconKey: deliveryIcons[index], position: index })),
    incidents: Array.from({ length: 3 }, (_, index) => ({ id: `incident-${index}`, affectedSystem: `Incident system ${index + 1}`, symptom: `Incident symptom ${index + 1}`, cause: null, actionTaken: `Incident action ${index + 1}`, supportPeople: null, status: "resolved" as const, resolvedAt: "2026-09-22", iconKey: incidentIcons[index], position: index })),
    demands: Array.from({ length: 2 }, (_, index) => ({ id: `demand-${index}`, title: `Demand fixture ${index + 1}`, requesterName: "Fixture requester", requesterArea: "Commercial", involvedAreas: ["Technology"], objective: `Demand objective ${index + 1}`, statusText: "In analysis", currentPhase: "development" as const, iconKey: "demand", position: index })),
    supportFronts: Array.from({ length: 3 }, (_, index) => ({ id: `support-${index}`, title: `Support fixture ${index + 1}`, activityType: "Monitoring", iconKey: supportIcons[index], position: index, routines: [{ id: `routine-${index}`, title: `Support routine ${index + 1}`, position: 0 }] })),
    dependencies: [],
    nextSteps: [],
  };
}

function attribute(tag: string | undefined, name: string) {
  return tag?.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

function pictureInfo(xml: string, name: string) {
  const picture = [...xml.matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)]
    .map((match) => match[0])
    .find((element) => attribute(element.match(/<p:cNvPr\b[^>]*>/)?.[0], "name") === name);
  if (!picture) return null;
  const properties = picture.match(/<p:cNvPr\b[^>]*>/)?.[0];
  const transform = picture.match(/<a:xfrm\b[\s\S]*?<\/a:xfrm>/)?.[0];
  const offset = transform?.match(/<a:off\b[^>]*>/)?.[0];
  const extent = transform?.match(/<a:ext\b[^>]*>/)?.[0];
  return {
    id: attribute(properties, "id"),
    x: attribute(offset, "x"),
    y: attribute(offset, "y"),
    cx: attribute(extent, "cx"),
    cy: attribute(extent, "cy"),
    relationshipId: attribute(picture.match(/<a:blip\b[^>]*>/)?.[0], "r:embed"),
  };
}

async function pictureMedia(zip: JSZip, slidePath: string, name: string) {
  const xmlFile = zip.file(slidePath);
  const relationFile = zip.file(`ppt/slides/_rels/${posix.basename(slidePath)}.rels`);
  if (!xmlFile || !relationFile) throw new Error(`Missing slide or relationships for ${slidePath}.`);
  const info = pictureInfo(await xmlFile.async("string"), name);
  if (!info?.relationshipId) throw new Error(`Missing picture ${name} in ${slidePath}.`);
  const relations = await relationFile.async("string");
  const relationship = [...relations.matchAll(/<Relationship\b[^>]*\/?\s*>/g)]
    .map((match) => match[0])
    .find((element) => attribute(element, "Id") === info.relationshipId);
  const target = attribute(relationship, "Target");
  if (!target) throw new Error(`Missing media relationship for ${name} in ${slidePath}.`);
  const mediaPath = posix.normalize(posix.join(posix.dirname(slidePath), target));
  const media = zip.file(mediaPath);
  if (!media) throw new Error(`Missing media part ${mediaPath}.`);
  return { info, buffer: await media.async("nodebuffer") };
}

function allShapeIds(xml: string) {
  return [...xml.matchAll(/<p:cNvPr\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
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
    const templateIcons = await readTemplateIconMedia(template);
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
    expect(text).toContain("Solicitação recebida");
    expect(text).toContain("Viabilidade e requisitos");
    expect(text).toContain("Desenvolvimento");
    expect(text).toContain("Homologação");
    expect(text).not.toMatch(/\{\{[^}]+\}\}|<%=?[^%]+%>|\$\{[^}]+\}|\[[^\]]+\]/);
    for (const slidePath of integrity.slideFiles) {
      const slideXml = await zip.file(slidePath)!.async("string");
      const ids = allShapeIds(slideXml);
      expect(new Set(ids).size, `unique shape IDs in ${slidePath}`).toBe(ids.length);
    }

    const iconAssertions = [
      { activeSlide: 2, templateSlide: 6, target: "Image 0", key: "integration" },
      { activeSlide: 2, templateSlide: 6, target: "Image 1", key: "database" },
      { activeSlide: 2, templateSlide: 6, target: "Image 2", key: "cloud" },
      { activeSlide: 2, templateSlide: 6, target: "Image 3", key: "process" },
      { activeSlide: 3, templateSlide: 6, target: "Image 0", key: "server" },
      { activeSlide: 4, templateSlide: 7, target: "Image 0", key: "incident" },
      { activeSlide: 4, templateSlide: 7, target: "Image 2", key: "blocked" },
      { activeSlide: 5, templateSlide: 7, target: "Image 0", key: "bug" },
      { activeSlide: 6, templateSlide: 8, target: "Image 0", key: "demand" },
      { activeSlide: 7, templateSlide: 8, target: "Image 0", key: "demand" },
      { activeSlide: 8, templateSlide: 9, target: "Image 0", key: "routine" },
      { activeSlide: 8, templateSlide: 9, target: "Image 4", key: "network" },
      { activeSlide: 9, templateSlide: 9, target: "Image 0", key: "security" },
    ] as const;
    for (const expected of iconAssertions) {
      const generatedSlidePath = integrity.slideFiles[expected.activeSlide];
      const outputPicture = await pictureMedia(zip, generatedSlidePath, expected.target);
      const sourcePicture = await pictureMedia(templateZip, `ppt/slides/slide${expected.templateSlide}.xml`, expected.target);
      const expectedMedia = templateIcons.get(expected.key);
      expect(expectedMedia).toBeTruthy();
      expect(outputPicture.info).toMatchObject({ id: sourcePicture.info.id, x: sourcePicture.info.x, y: sourcePicture.info.y, cx: sourcePicture.info.cx, cy: sourcePicture.info.cy });
      expect(outputPicture.buffer.equals(expectedMedia!.buffer), `${expected.key} media on ${generatedSlidePath}`).toBe(true);
    }

    const corrupted = Buffer.from(output);
    corrupted[corrupted.length - 20] ^= 0x01;
    await expect(assertPptxIntegrity(corrupted, 11)).rejects.toThrow("valid PPTX ZIP archive");
  });

  it("cleans empty incident and demand visuals from the actual master", async () => {
    const template = await readFile(templatePath);
    const input = fixture();
    input.incidents = [input.incidents[0]];
    input.demands = [];
    const output = await generatePptx(input, template);
    const zip = await JSZip.loadAsync(output, { checkCRC32: true });
    const integrity = await assertPptxIntegrity(output, 9);
    const incidentSlide = await zip.file(integrity.slideFiles[4])!.async("string");
    const demandSlide = await zip.file(integrity.slideFiles[5])!.async("string");

    expect(pictureInfo(incidentSlide, "Image 3")).toBeNull();
    expect(textFromXml(demandSlide).join(" ")).toContain("Sem ocorrências na semana.");
    expect(textFromXml(demandSlide).join(" ")).not.toMatch(/\[[^\]]+\]/);
    const emptyDemandText = textFromXml(demandSlide).join(" ");
    for (const phaseLabel of ["Solicitação recebida", "Viabilidade e requisitos", "Desenvolvimento", "Homologação"]) {
      expect(emptyDemandText).not.toContain(phaseLabel);
    }
  });
});

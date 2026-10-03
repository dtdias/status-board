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
    deliveries: Array.from(["delivered", "in_progress", "waiting_third_party", "blocked", "delivered"] as const, (status, index) => ({ id: `delivery-${index}`, title: `Delivery fixture ${index + 1}`, description: `Delivery description ${index + 1}`, status, iconKey: deliveryIcons[index], position: index })),
    incidents: Array.from(["resolved", "in_progress", "blocked"] as const, (status, index) => ({ id: `incident-${index}`, affectedSystem: `Incident system ${index + 1}`, symptom: `Incident symptom ${index + 1}`, cause: null, actionTaken: `Incident action ${index + 1}`, supportPeople: null, status, resolvedAt: status === "resolved" ? "2026-09-22" : null, iconKey: incidentIcons[index], position: index })),
    demands: Array.from({ length: 2 }, (_, index) => ({ id: `demand-${index}`, title: `Demand fixture ${index + 1}`, requesterName: "Fixture requester", requesterArea: "Commercial", involvedAreas: ["Technology"], objective: `Demand objective ${index + 1}`, statusText: "In analysis", currentPhase: "development" as const, iconKey: "demand", position: index })),
    supportFronts: Array.from({ length: 3 }, (_, index) => ({ id: `support-${index}`, title: `Support fixture ${index + 1}`, activityType: "Monitoring", iconKey: supportIcons[index], position: index, routines: [{ id: `routine-${index}`, title: `Support routine ${index + 1}`, position: 0 }] })),
    dependencies: [
      { id: "dependency-0", title: "Acesso ERP", description: "Aguardando credencial.", owner: "Infra", waitingSince: "2026-09-21", status: null, hideOwnerInPresentation: false, hideWaitingSinceInPresentation: false, position: 0 },
      { id: "dependency-1", title: "Homologação", description: "Aguardando área usuária.", owner: "Comercial", waitingSince: "2026-09-22", status: null, hideOwnerInPresentation: false, hideWaitingSinceInPresentation: false, position: 1 },
    ],
    nextSteps: [
      { id: "step-0", title: "Publicar ajuste", description: "Após liberar acesso.", owner: "Tecnologia", dueDate: "2026-09-30", hideOwnerInPresentation: false, hideDueDateInPresentation: false, position: 0 },
      { id: "step-1", title: "Validar carga", description: "Conferir primeira execução.", owner: "Comercial", dueDate: "2026-10-01", hideOwnerInPresentation: false, hideDueDateInPresentation: false, position: 1 },
    ],
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

function textShapeRuns(xml: string, name: string) {
  const shape = [...xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)]
    .map((match) => match[0])
    .find((element) => attribute(element.match(/<p:cNvPr\b[^>]*>/)?.[0], "name") === name);
  if (!shape) throw new Error(`Missing text shape ${name}.`);
  return [...shape.matchAll(/<a:r\b[\s\S]*?<\/a:r>/g)].map((match) => {
    const run = match[0];
    const properties = run.match(/<a:rPr\b[^>]*>/)?.[0];
    const solidFill = run.match(/<a:solidFill\b[\s\S]*?<\/a:solidFill>/)?.[0];
    return {
      text: run.match(/<a:t>([\s\S]*?)<\/a:t>/)?.[1],
      size: attribute(properties, "sz"),
      bold: attribute(properties, "b"),
      italic: attribute(properties, "i"),
      color: attribute(solidFill?.match(/<a:srgbClr\b[^>]*>/)?.[0], "val"),
      font: attribute(run.match(/<a:latin\b[^>]*>/)?.[0], "typeface"),
    };
  });
}

function textFromXml(xml: string) {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'"));
}

function shapeSolidFill(xml: string, name: string) {
  const shape = [...xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)]
    .map((match) => match[0])
    .find((element) => attribute(element.match(/<p:cNvPr\b[^>]*>/)?.[0], "name") === name);
  return shape?.match(/<p:spPr\b[\s\S]*?<a:solidFill>[\s\S]*?<a:srgbClr\b[^>]*val="([^"]+)"/)?.[1];
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
    expect(text).not.toMatch(/\{\{[^}]+\}\}|<%=?[^%]+%>|\$\{[^}]+\}/);
    for (const placeholder of [
      "[a entrega ou ocorrência mais importante da semana, em uma frase]",
      "[Nome da entrega]",
      "[O que você entregou e para quem, em 1 ou 2 linhas]",
      "[Status]",
      "[Sistema / processo afetado]",
      "[Sintoma e causa, se conhecida]",
      "[O que você fez e com quem, se teve apoio]",
      "[Status e data da resolução]",
      "[Nome da demanda]",
      "[Nome (Área)]",
      "[Áreas]",
      "[O que a área precisa, em 1 ou 2 frases]",
      "[Onde está hoje]",
      "[Concluído / Em andamento / Próxima fase]",
      "[Frente 1]",
      "[Frente 2]",
      "[Tipo de atividade, ex.: monitoramento e correções]",
      "[Rotina / sistema acompanhado]",
      "[aguardando o quê, de quem e desde quando]",
      "[o que será feito na próxima semana]",
    ]) expect(text).not.toContain(placeholder);

    const coverXml = await zip.file(integrity.slideFiles[0])!.async("string");
    expect(textShapeRuns(coverXml, "Text 0").map((run) => run.text)).toEqual(["[", "Technology", "]"]);
    expect(textShapeRuns(coverXml, "Text 3")[0].text).toBe("Real Template |  29/09/2026");

    const summaryXml = await zip.file(integrity.slideFiles[1])!.async("string");
    const highlightRuns = textShapeRuns(summaryXml, "Text 16");
    expect(highlightRuns.map((run) => run.text)).toEqual(["Destaque: ", "Fixture highlight"]);
    expect(highlightRuns[0]).toMatchObject({ bold: "1", color: "FFD400" });
    expect(highlightRuns[1]).toMatchObject({ italic: "1", color: "BFBFBF" });

    const incidentXml = await zip.file(integrity.slideFiles[4])!.async("string");
    const incidentBodyRuns = textShapeRuns(incidentXml, "Text 5");
    expect(incidentBodyRuns.map((run) => run.text)).toEqual(["O que aconteceu", "Incident symptom 1", " ", "O que fizemos", "Incident action 1"]);
    expect(incidentBodyRuns.map((run) => run.color)).toEqual(["D7191C", "8A8A8A", "000000", "D7191C", "8A8A8A"]);
    expect(incidentBodyRuns[1]).toMatchObject({ italic: "1", size: "1300" });
    expect(incidentBodyRuns[3]).toMatchObject({ bold: "1", size: "1200" });
    const deliveriesXml = await zip.file(integrity.slideFiles[2])!.async("string");
    expect(shapeSolidFill(deliveriesXml, "Shape 6")).toBe("2E8B57");
    expect(shapeSolidFill(deliveriesXml, "Shape 11")).toBe("2F5D8A");
    expect(shapeSolidFill(deliveriesXml, "Shape 16")).toBe("C77700");
    expect(shapeSolidFill(deliveriesXml, "Shape 21")).toBe("D7191C");
    expect(shapeSolidFill(incidentXml, "Shape 6")).toBe("2E8B57");
    expect(shapeSolidFill(incidentXml, "Shape 11")).toBe("2F5D8A");

    const firstDemandXml = await zip.file(integrity.slideFiles[6])!.async("string");
    expect(textShapeRuns(firstDemandXml, "Text 9").map((run) => run.text)).toEqual(["Solicitação recebida", "Concluído"]);
    const supportXml = await zip.file(integrity.slideFiles[8])!.async("string");
    const supportHeadingRuns = textShapeRuns(supportXml, "Text 4");
    expect(supportHeadingRuns.map((run) => run.text)).toEqual(["Support fixture 1", "Monitoring"]);
    expect(supportHeadingRuns[1]).toMatchObject({ italic: "1", size: "1100", color: "8A8A8A" });
    const attentionXml = await zip.file(integrity.slideFiles[10])!.async("string");
    expect(textShapeRuns(attentionXml, "Text 2").map((run) => run.text)).toEqual(["Dependências"]);
    expect(textShapeRuns(attentionXml, "Text 5").map((run) => run.text)).toEqual(["Próximos passos"]);
    const dependencyBodyRuns = textShapeRuns(attentionXml, "Text 3");
    expect(dependencyBodyRuns.map((run) => run.text)).toContain("Acesso ERP");
    expect(dependencyBodyRuns.map((run) => run.text)).toContain("Aguardando credencial.");
    expect(dependencyBodyRuns[0]).toMatchObject({ bold: "1", color: "FFD400" });
    expect(dependencyBodyRuns[2]).toMatchObject({ italic: "1", color: "A6A6A6" });

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

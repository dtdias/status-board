import Automizer, { ModifyColorHelper, ModifyImageHelper, modify, type ShapeModificationCallback, type XmlElement } from "pptx-automizer";
import { getReportIcon } from "@/lib/icons/report-icons";
import { assertPptxIntegrity, assertTemplateIntegrity } from "./integrity";
import { readTemplateIconMedia } from "./icons";
import { composePresentationSections, presentationSummary } from "./compose";
import { ATTENTION_SHAPES, COVER_SHAPES, DELIVERY_CARDS, DEMAND_SHAPES, HEADER_SHAPES, INCIDENT_CARDS, SUMMARY_SHAPES, SUPPORT_FRONTS, TEMPLATE_SLIDES } from "./template-map";
import type { DemandPhase, DeliveryStatus, IncidentStatus, PresentationInput } from "./types";

const STATUS_META: Record<DeliveryStatus | IncidentStatus, { label: string; color: string }> = {
  delivered: { label: "Entregue / Publicado", color: "2E8B57" },
  resolved: { label: "Resolvido", color: "2E8B57" },
  in_progress: { label: "Em andamento", color: "2F5D8A" },
  waiting_third_party: { label: "Aguardando terceiro", color: "C77700" },
  blocked: { label: "Bloqueado", color: "D7191C" },
};
const PHASES: DemandPhase[] = ["request_received", "feasibility_requirements", "development", "validation"];

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result.length ? result : [[]];
}

function date(value: string) {
  return value.slice(8, 10) + "/" + value.slice(5, 7);
}

function fullDate(value: string) {
  return `${date(value)}/${value.slice(0, 4)}`;
}

function coverFooter(input: PresentationInput) {
  return `${input.report.name} |  ${fullDate(input.report.presentationDate)}`;
}

function pageFooter(input: PresentationInput) {
  return `${input.report.name}  |  Semana ${date(input.report.startDate)} a ${date(input.report.endDate)}`;
}

function setPage(slide: Parameters<Automizer["addSlide"]>[2] extends ((slide: infer T) => void) | undefined ? T : never, input: PresentationInput, page: number) {
  slide.modifyElement(HEADER_SHAPES.footer, modify.setText(pageFooter(input)));
  slide.modifyElement(HEADER_SHAPES.pageNumber, modify.setText(String(page)));
}

function replaceTextRuns(slide: Parameters<Automizer["addSlide"]>[2] extends ((slide: infer T) => void) | undefined ? T : never, shape: string, replacements: Array<{ placeholder: string; value: string }>) {
  const replace = (element: XmlElement) => {
    const runs = element.getElementsByTagName("a:t");
    let cursor = 0;
    for (const replacement of replacements) {
      let found = false;
      for (let index = cursor; index < runs.length; index += 1) {
        if (runs[index].textContent !== replacement.placeholder) continue;
        runs[index].textContent = replacement.value;
        cursor = index + 1;
        found = true;
        break;
      }
      if (!found) throw new Error(`Template text run missing in ${shape}: ${replacement.placeholder}`);
    }
  };
  slide.modifyElement(shape, replace);
}

type PptxTextParagraph = Parameters<typeof modify.setMultiText>[0][number];

function attentionBody(input: PresentationInput, section: "dependencies" | "nextSteps"): PptxTextParagraph[] {
  const headingStyle = { color: { type: "srgbClr" as const, value: "FFD400" }, size: 1400, isBold: true, fontFamily: "Calibri" };
  const bodyStyle = { color: { type: "srgbClr" as const, value: "A6A6A6" }, size: 1400, isItalics: true, fontFamily: "Calibri" };
  const empty = (message: string): PptxTextParagraph[] => [{ paragraph: {}, text: message, style: headingStyle }];

  if (section === "dependencies") {
    const items = input.dependencies.slice(0, 2);
    if (!items.length) return empty("Sem dependências em aberto.");
    const paragraphs: PptxTextParagraph[] = [];
    items.forEach((item, index) => {
      paragraphs.push({
        paragraph: {},
        textRuns: [
          { text: item.title, style: headingStyle },
          { text: ": ", style: headingStyle },
          { text: `${item.description}\nResponsável: ${item.owner}\nDesde: ${date(item.waitingSince)}`, style: bodyStyle },
        ],
      });
      if (index < items.length - 1) paragraphs.push({ paragraph: {}, text: " ", style: { size: 800, fontFamily: "Calibri" } });
    });
    return paragraphs;
  }

  const items = input.nextSteps.slice(0, 2);
  if (!items.length) return empty("Sem ocorrências.");
  const paragraphs: PptxTextParagraph[] = [];
  items.forEach((item, index) => {
    const details = `${item.description ?? ""}${item.owner ? `\nResponsável: ${item.owner}` : ""}${item.dueDate ? `\nPrazo: ${date(item.dueDate)}` : ""}`;
    paragraphs.push({
      paragraph: {},
      textRuns: [
        { text: item.title, style: headingStyle },
        { text: ": ", style: headingStyle },
        { text: details, style: bodyStyle },
      ],
    });
    if (index < items.length - 1) paragraphs.push({ paragraph: {}, text: " ", style: { size: 800, fontFamily: "Calibri" } });
  });
  return paragraphs;
}

function removeCard(slide: Parameters<Automizer["addSlide"]>[2] extends ((slide: infer T) => void) | undefined ? T : never, card: object) {
  const remove = (value: unknown) => {
    if (typeof value === "string") return slide.removeElement(value);
    if (Array.isArray(value)) return value.forEach(remove);
    if (value && typeof value === "object") Object.values(value).forEach(remove);
  };
  remove(card);
}

function replaceIcon(slide: Parameters<Automizer["addSlide"]>[2] extends ((slide: infer T) => void) | undefined ? T : never, target: string, iconKey: string, iconMedia: Awaited<ReturnType<typeof readTemplateIconMedia>>) {
  const icon = getReportIcon(iconKey);
  const media = icon ? iconMedia.get(icon.key) : undefined;
  if (!media) throw new Error(`Unsupported or missing report icon: ${iconKey}.`);
  const replaceMedia = ModifyImageHelper.setRelationTarget(media.fileName);
  const replaceImageRelation: ShapeModificationCallback = (element: XmlElement, relation?: XmlElement) => {
    if (!relation) throw new Error(`Template icon shape ${target} has no media relationship.`);
    replaceMedia(element, relation);
  };
  slide.modifyElement(target, replaceImageRelation);
}

export async function generatePptx(input: PresentationInput, templateBuffer: Buffer): Promise<Buffer> {
  await assertTemplateIntegrity(templateBuffer);
  const iconMedia = await readTemplateIconMedia(templateBuffer);
  const expectedSlides = composePresentationSections(input).length;
  const automizer = new Automizer({ removeExistingSlides: true, autoImportSlideMasters: true, cleanup: false, compression: 6, verbosity: 0 });
  const presentation = automizer.loadRoot(templateBuffer).load(templateBuffer, "template");
  const summary = presentationSummary(input);
  let page = 1;

  presentation.addSlide("template", TEMPLATE_SLIDES.cover, (slide) => {
    replaceTextRuns(slide, COVER_SHAPES.area, [{ placeholder: "Área", value: input.report.area }]);
    slide.modifyElement(COVER_SHAPES.week, modify.setText(`Semana de ${date(input.report.startDate)} a ${date(input.report.endDate)}/${input.report.endDate.slice(0, 4)}`));
    slide.modifyElement(COVER_SHAPES.footer, modify.setText(coverFooter(input)));
  });
  page += 1;

  presentation.addSlide("template", TEMPLATE_SLIDES.summary, (slide) => {
    setPage(slide, input, page);
    slide.modifyElement(SUMMARY_SHAPES.deliveryCount, modify.setText(String(summary.deliveries)));
    slide.modifyElement(SUMMARY_SHAPES.incidentCount, modify.setText(String(summary.resolvedIncidents)));
    slide.modifyElement(SUMMARY_SHAPES.demandCount, modify.setText(String(summary.newDemands)));
    slide.modifyElement(SUMMARY_SHAPES.supportCount, modify.setText(String(summary.supportRoutines)));
    replaceTextRuns(slide, SUMMARY_SHAPES.highlight, [{ placeholder: "[a entrega ou ocorrência mais importante da semana, em uma frase]", value: input.report.highlight }]);
  });
  page += 1;

  for (const items of chunks(input.deliveries, 4)) {
    presentation.addSlide("template", TEMPLATE_SLIDES.deliveries, (slide) => {
      setPage(slide, input, page++);
      if (!items.length) {
        slide.modifyElement(DELIVERY_CARDS[0].title, modify.setText("Sem ocorrências na semana."));
        slide.modifyElement(DELIVERY_CARDS[0].description, modify.setText(""));
        slide.modifyElement(DELIVERY_CARDS[0].statusText, modify.setText(""));
        slide.removeElement(DELIVERY_CARDS[0].icon);
        slide.removeElement(DELIVERY_CARDS[0].statusBackground);
        DELIVERY_CARDS.slice(1).forEach((card) => removeCard(slide, card));
        return;
      }
      DELIVERY_CARDS.forEach((card, index) => {
        const item = items[index];
        if (!item) return removeCard(slide, card);
        const status = STATUS_META[item.status];
        slide.modifyElement(card.title, modify.setText(item.title));
        slide.modifyElement(card.description, modify.setText(item.description));
        slide.modifyElement(card.statusText, modify.setText(status.label));
        slide.modifyElement(card.statusBackground, ModifyColorHelper.solidFill({ value: status.color }));
        replaceIcon(slide, card.icon, item.iconKey, iconMedia);
      });
    });
  }

  for (const items of chunks(input.incidents, 2)) {
    presentation.addSlide("template", TEMPLATE_SLIDES.incidents, (slide) => {
      setPage(slide, input, page++);
      if (!items.length) {
        slide.modifyElement(INCIDENT_CARDS[0].title, modify.setText("Sem incidentes na semana."));
        slide.modifyElement(INCIDENT_CARDS[0].body, modify.setText(""));
        slide.modifyElement(INCIDENT_CARDS[0].statusText, modify.setText(""));
        slide.removeElement(INCIDENT_CARDS[0].icon);
        slide.removeElement(INCIDENT_CARDS[0].statusBackground);
        slide.removeElement(INCIDENT_CARDS[0].statusIcon);
        INCIDENT_CARDS.slice(1).forEach((card) => removeCard(slide, card));
        return;
      }
      INCIDENT_CARDS.forEach((card, index) => {
        const item = items[index];
        if (!item) return removeCard(slide, card);
        const status = STATUS_META[item.status];
        const resolution = item.status === "resolved" && item.resolvedAt ? `\nData: ${date(item.resolvedAt)}` : "";
        slide.modifyElement(card.title, modify.setText(item.affectedSystem));
        slide.modifyElement(card.body, modify.setMultiText([
          { paragraph: {}, text: "O que aconteceu", style: { size: 1200, color: { type: "srgbClr", value: "D7191C" }, isBold: true, fontFamily: "Calibri" } },
          { paragraph: {}, text: `${item.symptom}${item.cause ? `\n${item.cause}` : ""}`, style: { size: 1300, color: { type: "srgbClr", value: "8A8A8A" }, isItalics: true, fontFamily: "Calibri" } },
          { paragraph: {}, text: " ", style: { size: 1000, color: { type: "srgbClr", value: "000000" }, fontFamily: "Calibri" } },
          { paragraph: {}, text: "O que fizemos", style: { size: 1200, color: { type: "srgbClr", value: "D7191C" }, isBold: true, fontFamily: "Calibri" } },
          { paragraph: {}, text: `${item.actionTaken}${item.supportPeople ? `\n${item.supportPeople}` : ""}`, style: { size: 1300, color: { type: "srgbClr", value: "8A8A8A" }, isItalics: true, fontFamily: "Calibri" } },
        ]));
        slide.modifyElement(card.statusText, modify.setText(`Status: ${status.label}${resolution}`));
        slide.modifyElement(card.statusBackground, ModifyColorHelper.solidFill({ value: status.color }));
        replaceIcon(slide, card.icon, item.iconKey, iconMedia);
      });
    });
  }

  for (const item of input.demands.length ? input.demands : [null]) {
    presentation.addSlide("template", TEMPLATE_SLIDES.demands, (slide) => {
      setPage(slide, input, page++);
      if (!item) {
        slide.modifyElement(DEMAND_SHAPES.demandTitle, modify.setText("Sem ocorrências na semana."));
        slide.modifyElement(DEMAND_SHAPES.demandBody, modify.setText(""));
        slide.removeElement(DEMAND_SHAPES.icon);
        slide.removeElement(DEMAND_SHAPES.timelineLine);
        removeCard(slide, DEMAND_SHAPES.phases);
        return;
      }
      slide.modifyElement(DEMAND_SHAPES.demandTitle, modify.setText(item.title));
      replaceTextRuns(slide, DEMAND_SHAPES.demandBody, [
        { placeholder: "[Nome (Área)]", value: `${item.requesterName} (${item.requesterArea})` },
        { placeholder: "[Áreas]", value: item.involvedAreas.join(", ") },
        { placeholder: "[O que a área precisa, em 1 ou 2 frases]", value: item.objective },
        { placeholder: "[Onde está hoje]", value: item.statusText ?? "" },
      ]);
      replaceIcon(slide, DEMAND_SHAPES.icon, item.iconKey, iconMedia);
      const current = PHASES.indexOf(item.currentPhase);
      DEMAND_SHAPES.phases.forEach((phase, index) => {
        slide.modifyElement(phase.circle, ModifyColorHelper.solidFill({ value: index < current ? "2E8B57" : index === current ? "FFD400" : "D9D9D9" }));
        slide.modifyElement(phase.number, modify.setText(String(index + 1)));
        const state = index < current ? "Concluído" : index === current ? "Em andamento" : "Próxima fase";
        replaceTextRuns(slide, phase.label, [{ placeholder: "[Concluído / Em andamento / Próxima fase]", value: state }]);
      });
    });
  }

  for (const items of chunks(input.supportFronts, 2)) {
    presentation.addSlide("template", TEMPLATE_SLIDES.support, (slide) => {
      setPage(slide, input, page++);
      if (!items.length) {
        slide.modifyElement(SUPPORT_FRONTS[0].heading, modify.setText("Sem ocorrências na semana."));
        slide.removeElement(SUPPORT_FRONTS[0].icon);
        SUPPORT_FRONTS[0].routines.forEach((routine) => removeCard(slide, routine));
        removeCard(slide, SUPPORT_FRONTS[1]);
        return;
      }
      SUPPORT_FRONTS.forEach((slot, index) => {
        const item = items[index];
        if (!item) return removeCard(slide, slot);
        replaceTextRuns(slide, slot.heading, [
          { placeholder: index === 0 ? "[Frente 1]" : "[Frente 2]", value: item.title },
          { placeholder: "[Tipo de atividade, ex.: monitoramento e correções]", value: item.activityType },
        ]);
        replaceIcon(slide, slot.icon, item.iconKey, iconMedia);
        slot.routines.forEach((routineSlot, routineIndex) => {
          const routine = item.routines[routineIndex];
          if (!routine) return removeCard(slide, routineSlot);
          slide.modifyElement(routineSlot.text, modify.setText(routine.title));
        });
      });
    });
  }

  presentation.addSlide("template", TEMPLATE_SLIDES.attention, (slide) => {
    slide.modifyElement(ATTENTION_SHAPES.footer, modify.setText(pageFooter(input)));
    slide.modifyElement(ATTENTION_SHAPES.pageNumber, modify.setText(String(page)));
    slide.modifyElement(ATTENTION_SHAPES.dependencyBody, modify.setMultiText(attentionBody(input, "dependencies")));
    slide.modifyElement(ATTENTION_SHAPES.nextStepsBody, modify.setMultiText(attentionBody(input, "nextSteps")));
  });

  const zip = await presentation.getJSZip();
  const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await assertPptxIntegrity(output, expectedSlides);
  return output;
}

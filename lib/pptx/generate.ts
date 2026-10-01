import Automizer, { ModifyColorHelper, ModifyImageHelper, modify, type ShapeModificationCallback, type XmlElement } from "pptx-automizer";
import { demandPhaseLabels } from "@/lib/demands/demand";
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

function footer(input: PresentationInput) {
  return `${input.report.name} | ${date(input.report.presentationDate)}`;
}

function setPage(slide: Parameters<Automizer["addSlide"]>[2] extends ((slide: infer T) => void) | undefined ? T : never, input: PresentationInput, page: number) {
  slide.modifyElement(HEADER_SHAPES.footer, modify.setText(footer(input)));
  slide.modifyElement(HEADER_SHAPES.pageNumber, modify.setText(String(page)));
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
    slide.modifyElement(COVER_SHAPES.area, modify.setText(input.report.area));
    slide.modifyElement(COVER_SHAPES.week, modify.setText(`Semana de ${date(input.report.startDate)} a ${date(input.report.endDate)}/${input.report.endDate.slice(0, 4)}`));
    slide.modifyElement(COVER_SHAPES.footer, modify.setText(footer(input)));
  });
  page += 1;

  presentation.addSlide("template", TEMPLATE_SLIDES.summary, (slide) => {
    setPage(slide, input, page);
    slide.modifyElement(SUMMARY_SHAPES.deliveryCount, modify.setText(String(summary.deliveries)));
    slide.modifyElement(SUMMARY_SHAPES.incidentCount, modify.setText(String(summary.resolvedIncidents)));
    slide.modifyElement(SUMMARY_SHAPES.demandCount, modify.setText(String(summary.newDemands)));
    slide.modifyElement(SUMMARY_SHAPES.supportCount, modify.setText(String(summary.supportRoutines)));
    slide.modifyElement(SUMMARY_SHAPES.highlight, modify.setText(input.report.highlight));
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
        slide.modifyElement(card.body, modify.setText(`O que aconteceu\n${item.symptom}${item.cause ? `\n${item.cause}` : ""}\n\nO que fizemos\n${item.actionTaken}${item.supportPeople ? `\n${item.supportPeople}` : ""}`));
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
      slide.modifyElement(DEMAND_SHAPES.demandBody, modify.setText(`Solicitante: ${item.requesterName} (${item.requesterArea})\nÁreas envolvidas: ${item.involvedAreas.join(", ")}\n\nObjetivo: ${item.objective}\n\nStatus: ${item.statusText ?? ""}`));
      replaceIcon(slide, DEMAND_SHAPES.icon, item.iconKey, iconMedia);
      const current = PHASES.indexOf(item.currentPhase);
      DEMAND_SHAPES.phases.forEach((phase, index) => {
        slide.modifyElement(phase.circle, ModifyColorHelper.solidFill({ value: index < current ? "2E8B57" : index === current ? "FFD400" : "A6A6A6" }));
        slide.modifyElement(phase.number, modify.setText(String(index + 1)));
        slide.modifyElement(phase.label, modify.setText(demandPhaseLabels[index]));
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
        slide.modifyElement(slot.heading, modify.setText(`${item.title}\n${item.activityType}`));
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
    slide.modifyElement(ATTENTION_SHAPES.footer, modify.setText(footer(input)));
    slide.modifyElement(ATTENTION_SHAPES.pageNumber, modify.setText(String(page)));
    const dependencies = input.dependencies.slice(0, 2);
    const nextSteps = input.nextSteps.slice(0, 2);
    slide.modifyElement(ATTENTION_SHAPES.dependencyTitle, modify.setText(dependencies.length ? dependencies.map((item) => item.title).join("\n") : "Sem dependências."));
    slide.modifyElement(ATTENTION_SHAPES.dependencyBody, modify.setText(dependencies.map((item) => `${item.description}\nResponsável: ${item.owner}\nDesde: ${date(item.waitingSince)}`).join("\n\n")));
    slide.modifyElement(ATTENTION_SHAPES.nextStepsTitle, modify.setText(nextSteps.length ? nextSteps.map((item) => item.title).join("\n") : "Sem próximos passos."));
    slide.modifyElement(ATTENTION_SHAPES.nextStepsBody, modify.setText(nextSteps.map((item) => `${item.description ?? ""}${item.owner ? `\nResponsável: ${item.owner}` : ""}${item.dueDate ? `\nPrazo: ${date(item.dueDate)}` : ""}`).join("\n\n")));
  });

  const zip = await presentation.getJSZip();
  const output = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await assertPptxIntegrity(output, expectedSlides);
  return output;
}

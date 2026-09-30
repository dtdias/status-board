import { calculateReportSummary } from "@/lib/reports/summary";
import { CONTENT_LIMITS } from "@/lib/validation/report";

export type PreviewReport = {
  id: string;
  name: string;
  area: string;
  startDate: string;
  endDate: string;
  presentationDate: string | null;
  highlight: string | null;
};

export type PreviewInput = {
  report: PreviewReport;
  deliveries: Array<{ id: string; title: string; description: string; status: "delivered" | "in_progress" | "waiting_third_party" | "blocked"; iconKey: string }>;
  incidents: Array<{ id: string; affectedSystem: string; symptom: string; cause: string | null; actionTaken: string; supportPeople: string | null; status: "resolved" | "in_progress" | "waiting_third_party" | "blocked"; resolvedAt: string | null; iconKey: string }>;
  demands: Array<{ id: string; title: string; requesterName: string; requesterArea: string; involvedAreas: string[]; objective: string; statusText: string | null; currentPhase: "request_received" | "feasibility_requirements" | "development" | "validation"; iconKey: string }>;
  supportFronts: Array<{ id: string; title: string; activityType: string; iconKey: string; routines: Array<{ id: string; title: string }> }>;
  dependencies: Array<{ id: string; title: string; description: string; owner: string; waitingSince: string; status: string | null }>;
  nextSteps: Array<{ id: string; title: string; description: string | null; owner: string | null; dueDate: string | null }>;
};

export type PreviewSlide =
  | { kind: "cover"; title: string }
  | { kind: "summary"; title: string; summary: ReturnType<typeof calculateReportSummary> }
  | { kind: "deliveries"; title: string; items: PreviewInput["deliveries"] }
  | { kind: "incidents"; title: string; items: PreviewInput["incidents"] }
  | { kind: "demand"; title: string; item: PreviewInput["demands"][number] | null }
  | { kind: "support"; title: string; items: PreviewInput["supportFronts"] }
  | { kind: "attention"; title: string; dependencies: PreviewInput["dependencies"]; nextSteps: PreviewInput["nextSteps"] };

export type PreviewOverflow = { section: string; entityId: string; field: string; limit: number };

function chunks<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size));
  return pages.length ? pages : [[]];
}

function overflow(value: string | null, section: string, entityId: string, field: string, limit: number): PreviewOverflow[] {
  return value && value.length > limit ? [{ section, entityId, field, limit }] : [];
}

export function composePreviewSlides(input: PreviewInput): PreviewSlide[] {
  const summary = calculateReportSummary(input);
  return [
    { kind: "cover", title: "Status Semanal" },
    { kind: "summary", title: "Resumo da semana", summary },
    ...chunks(input.deliveries, 4).map((items) => ({ kind: "deliveries" as const, title: "Entregas da semana", items })),
    ...chunks(input.incidents, 2).map((items) => ({ kind: "incidents" as const, title: "Incidentes em produção", items })),
    ...(input.demands.length ? input.demands.map((item) => ({ kind: "demand" as const, title: "Demandas novas", item })) : [{ kind: "demand" as const, title: "Demandas novas", item: null }]),
    ...chunks(input.supportFronts, 2).map((items) => ({ kind: "support" as const, title: "Rotina de sustentação", items })),
    { kind: "attention", title: "Pontos de atenção e próximos passos", dependencies: input.dependencies, nextSteps: input.nextSteps },
  ];
}

export function findPreviewOverflow(input: PreviewInput): PreviewOverflow[] {
  return [
    ...input.deliveries.flatMap((item) => [...overflow(item.title, "Entrega", item.id, "Título", CONTENT_LIMITS.deliveryTitle), ...overflow(item.description, "Entrega", item.id, "Descrição", CONTENT_LIMITS.deliveryDescription)]),
    ...input.incidents.flatMap((item) => [...overflow(item.affectedSystem, "Incidente", item.id, "Sistema", CONTENT_LIMITS.incidentSystem), ...overflow(item.symptom, "Incidente", item.id, "Sintoma", CONTENT_LIMITS.incidentSymptom), ...overflow(item.cause, "Incidente", item.id, "Causa", CONTENT_LIMITS.incidentCause), ...overflow(item.actionTaken, "Incidente", item.id, "Ação", CONTENT_LIMITS.incidentAction)]),
    ...input.demands.flatMap((item) => [...overflow(item.title, "Demanda", item.id, "Título", CONTENT_LIMITS.demandTitle), ...overflow(item.objective, "Demanda", item.id, "Objetivo", CONTENT_LIMITS.demandObjective), ...overflow(item.statusText, "Demanda", item.id, "Status", CONTENT_LIMITS.demandStatus)]),
    ...input.supportFronts.flatMap((item) => [...overflow(item.title, "Sustentação", item.id, "Título", CONTENT_LIMITS.supportFrontTitle), ...overflow(item.activityType, "Sustentação", item.id, "Atividade", CONTENT_LIMITS.supportActivityType), ...item.routines.flatMap((routine) => overflow(routine.title, "Sustentação", routine.id, "Rotina", CONTENT_LIMITS.supportRoutine))]),
    ...input.dependencies.flatMap((item) => [...overflow(item.title, "Dependência", item.id, "Título", CONTENT_LIMITS.dependencyTitle), ...overflow(item.description, "Dependência", item.id, "Descrição", CONTENT_LIMITS.dependencyDescription)]),
    ...input.nextSteps.flatMap((item) => [...overflow(item.title, "Próximo passo", item.id, "Título", CONTENT_LIMITS.nextStepTitle), ...overflow(item.description, "Próximo passo", item.id, "Descrição", CONTENT_LIMITS.nextStepDescription)]),
    ...overflow(input.report.highlight, "Resumo", input.report.id, "Destaque", CONTENT_LIMITS.highlight),
  ];
}

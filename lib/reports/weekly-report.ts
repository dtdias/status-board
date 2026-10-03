import { z } from "zod";
import { CONTENT_LIMITS } from "@/lib/validation/report";

export const reportStatuses = ["draft", "ready", "generated", "presented", "archived"] as const;
export type ReportStatus = (typeof reportStatuses)[number];

const allowedTransitions: Record<ReportStatus, readonly ReportStatus[]> = {
  draft: ["ready"],
  ready: ["draft", "generated"],
  generated: ["ready", "presented", "archived"],
  presented: ["archived"],
  archived: [],
};

export function canTransitionReportStatus(from: ReportStatus, to: ReportStatus) {
  return allowedTransitions[from].includes(to);
}

export function reportStatusLabel(status: ReportStatus) {
  return { draft: "Rascunho", ready: "Pronto para gerar", generated: "Gerado", presented: "Apresentado", archived: "Arquivado" }[status];
}

export function reportStatusFromSearchParam(status: string | undefined): ReportStatus | undefined {
  return reportStatuses.includes(status as ReportStatus) ? status as ReportStatus : undefined;
}

export function reportStatusNextStep(status: ReportStatus) {
  return {
    draft: "Complete o conteúdo e marque como pronto.",
    ready: "Revise o conteúdo e gere a apresentação.",
    generated: "Registre a apresentação ou retorne para edição.",
    presented: "Arquive quando não precisar mais alterar.",
    archived: "Consulta e download somente.",
  }[status];
}

export function reportStatusDashboardAction(status: ReportStatus) {
  return {
    draft: "Continuar edição",
    ready: "Revisar e gerar",
    generated: "Registrar apresentação",
    presented: "Arquivar relatório",
    archived: "Abrir consulta",
  }[status];
}

export const weeklyReportSchema = z
  .object({
    startDate: z.iso.date("Informe a data inicial."),
    endDate: z.iso.date("Informe a data final."),
    presentationDate: z.iso.date("Informe a data da apresentação."),
    highlight: z.string().trim().min(1, "Informe o destaque da semana.").max(CONTENT_LIMITS.highlight, `O destaque deve ter no máximo ${CONTENT_LIMITS.highlight} caracteres.`),
  })
  .refine(({ startDate, endDate }) => endDate >= startDate, {
    error: "A data final deve ser igual ou posterior à data inicial.",
    path: ["endDate"],
  });

export type WeeklyReportInput = z.infer<typeof weeklyReportSchema>;

export const reportDetailsSchema = z
  .object({
    startDate: z.iso.date("Informe a data inicial."),
    endDate: z.iso.date("Informe a data final."),
    presentationDate: z.iso.date("Informe a data da apresentação."),
    highlight: z.string().trim().min(1, "Informe o destaque da semana.").max(CONTENT_LIMITS.highlight, `O destaque deve ter no máximo ${CONTENT_LIMITS.highlight} caracteres.`),
  })
  .refine(({ startDate, endDate }) => endDate >= startDate, {
    error: "A data final deve ser igual ou posterior à data inicial.",
    path: ["endDate"],
  });

export type ReportDetailsInput = z.infer<typeof reportDetailsSchema>;

export function formatWeekRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return `${formatter.format(new Date(`${startDate}T00:00:00`))} a ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
}

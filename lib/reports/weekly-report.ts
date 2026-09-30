import { z } from "zod";

export const weeklyReportSchema = z
  .object({
    startDate: z.iso.date("Informe a data inicial."),
    endDate: z.iso.date("Informe a data final."),
    presentationDate: z.iso.date("Informe a data da apresentação."),
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
    highlight: z.string().trim().min(1, "Informe o destaque da semana.").max(180, "O destaque deve ter no máximo 180 caracteres."),
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

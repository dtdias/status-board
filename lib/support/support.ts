import { z } from "zod";
import { reportIconKeys, type ReportIconKey } from "@/lib/icons/report-icons";
import { CONTENT_LIMITS } from "@/lib/validation/report";

export const supportIcons = ["routine", "process", "server", "database", "cloud", "network", "security", "notification"] as const satisfies readonly ReportIconKey[];

export const supportFrontSchema = z.object({
  title: z.string().trim().min(1, "Informe o nome da frente.").max(CONTENT_LIMITS.supportFrontTitle, "Nome deve ter no máximo 50 caracteres."),
  activityType: z.string().trim().min(1, "Informe o tipo de atividade.").max(CONTENT_LIMITS.supportActivityType, "Tipo deve ter no máximo 80 caracteres."),
  iconKey: z.enum(reportIconKeys, "Selecione um ícone válido."),
});

export const supportRoutineSchema = z.object({
  title: z.string().trim().min(1, "Informe a rotina.").max(CONTENT_LIMITS.supportRoutine, "Rotina deve ter no máximo 90 caracteres."),
});

export const supportFrontWithRoutinesSchema = supportFrontSchema.extend({
  routines: z.array(supportRoutineSchema).max(3, "Cada frente pode ter no máximo 3 rotinas."),
});

export const MAX_ROUTINES_PER_FRONT = 3;

export type SupportFrontInput = z.infer<typeof supportFrontSchema>;
export type SupportRoutineInput = z.infer<typeof supportRoutineSchema>;

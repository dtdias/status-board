import { z } from "zod";
import { CONTENT_LIMITS } from "@/lib/validation/report";

export const attentionLimits = {
  dependencyTitle: CONTENT_LIMITS.dependencyTitle,
  dependencyDescription: CONTENT_LIMITS.dependencyDescription,
  nextStepTitle: CONTENT_LIMITS.nextStepTitle,
  nextStepDescription: CONTENT_LIMITS.nextStepDescription,
} as const;

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const dependencySchema = z.object({
  title: z.string().trim().min(1, "Informe o título da dependência.").max(attentionLimits.dependencyTitle),
  description: z.string().trim().min(1, "Informe a descrição da dependência.").max(attentionLimits.dependencyDescription),
  owner: z.string().trim().min(1, "Informe o responsável da dependência.").max(80),
  waitingSince: z.string().trim().min(1, "Informe desde quando está aguardando.").date("Informe uma data válida."),
  status: optionalText(100),
  hideOwnerInPresentation: z.boolean().default(false),
  hideWaitingSinceInPresentation: z.boolean().default(false),
});

export const nextStepSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do próximo passo.").max(attentionLimits.nextStepTitle),
  description: optionalText(attentionLimits.nextStepDescription),
  owner: optionalText(80),
  dueDate: z.string().trim().transform((value) => value || null).pipe(z.string().date("Informe uma data válida.").nullable()),
  hideOwnerInPresentation: z.boolean().default(false),
  hideDueDateInPresentation: z.boolean().default(false),
});

export type DependencyInput = z.infer<typeof dependencySchema>;
export type NextStepInput = z.infer<typeof nextStepSchema>;

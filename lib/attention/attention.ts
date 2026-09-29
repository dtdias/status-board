import { z } from "zod";

export const attentionLimits = {
  dependencyTitle: 60,
  dependencyDescription: 160,
  nextStepTitle: 60,
  nextStepDescription: 160,
} as const;

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);

export const dependencySchema = z.object({
  title: z.string().trim().min(1, "Informe o título da dependência.").max(attentionLimits.dependencyTitle),
  description: z.string().trim().min(1, "Informe a descrição da dependência.").max(attentionLimits.dependencyDescription),
  owner: z.string().trim().min(1, "Informe o responsável da dependência.").max(80),
  waitingSince: z.string().trim().min(1, "Informe desde quando está aguardando.").date("Informe uma data válida."),
  status: optionalText(100),
});

export const nextStepSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do próximo passo.").max(attentionLimits.nextStepTitle),
  description: optionalText(attentionLimits.nextStepDescription),
  owner: optionalText(80),
  dueDate: z.string().trim().transform((value) => value || null).pipe(z.string().date("Informe uma data válida.").nullable()),
});

export type DependencyInput = z.infer<typeof dependencySchema>;
export type NextStepInput = z.infer<typeof nextStepSchema>;

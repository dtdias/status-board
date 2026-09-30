import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome deve ter no máximo 80 caracteres."),
  area: z.string().trim().min(2, "Informe sua área.").max(80, "Área deve ter no máximo 80 caracteres."),
});

export type ProfileInput = z.infer<typeof profileSchema>;

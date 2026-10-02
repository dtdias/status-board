import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(72),
  passwordConfirmation: z.string(),
}).refine((input) => input.password === input.passwordConfirmation, {
  message: "As senhas não coincidem.",
  path: ["passwordConfirmation"],
});

export type SignUpInput = z.infer<typeof signUpSchema>;

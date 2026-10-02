import { z } from "zod";

export const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(254);
export const passwordSchema = z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(72);

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine((input) => input.password === input.passwordConfirmation, {
  message: "As senhas não coincidem.",
  path: ["passwordConfirmation"],
});

export type SignUpInput = z.infer<typeof signUpSchema>;

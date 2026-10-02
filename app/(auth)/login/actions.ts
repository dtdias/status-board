"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { getRedirectOrigin } from "@/lib/auth/redirect-url";
import { emailSchema } from "@/lib/validation/auth";

export type LoginState = { error?: string };
export type EmailActionState = { error?: string; success?: string; email?: string };

export async function signIn(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Não foi possível entrar. Verifique suas credenciais." };
  }

  redirect("/app" as Route);
}

export async function requestPasswordReset(_: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Informe um e-mail válido." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.toLowerCase(), {
    redirectTo: `${getRedirectOrigin(await headers())}/auth/callback?next=/reset-password`,
  });

  return { success: "Se houver uma conta para este e-mail, enviaremos instruções para redefinir a senha.", email: parsed.data.toLowerCase() };
}

export async function requestMagicLink(_: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Informe um e-mail válido." };

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email: parsed.data.toLowerCase(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${getRedirectOrigin(await headers())}/auth/callback?next=/app`,
    },
  });

  return { success: "Se houver uma conta confirmada para este e-mail, enviaremos um link de acesso.", email: parsed.data.toLowerCase() };
}

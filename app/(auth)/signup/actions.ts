"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, signUpSchema } from "@/lib/validation/auth";
import { getRedirectOrigin } from "@/lib/auth/redirect-url";

export type SignUpState = { error?: string; success?: string; email?: string };
export type ResendState = { error?: string; success?: string; email?: string; cooldownUntil?: number; accountConfirmed?: boolean };

export async function signUp(_: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getRedirectOrigin(await headers())}/auth/callback?next=/app`,
    },
  });

  if (error) return { error: "Não foi possível criar a conta. Verifique os dados e tente novamente." };
  if (data.session) redirect("/app" as Route);
  if (data.user?.email_confirmed_at || data.user?.confirmed_at) {
    return { success: "Esta conta já está confirmada. Entre usando sua senha ou um Magic Link." };
  }

  return { success: "Se o e-mail estiver disponível, enviaremos um link de confirmação.", email: parsed.data.email.toLowerCase() };
}

export async function resendConfirmation(_: ResendState, formData: FormData): Promise<ResendState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Informe um e-mail válido." };

  const email = parsed.data.toLowerCase();
  const emailHash = createHash("sha256").update(email).digest("hex");
  const supabase = await createClient();
  const { data: claim, error: claimError } = await supabase.rpc("claim_signup_confirmation_resend", {
    target_email_hash: emailHash,
  });

  if (claimError) return { error: "Não foi possível solicitar o reenvio. Tente novamente." };

  const result = claim?.[0];
  const cooldownSeconds = result?.allowed ? 300 : (result?.retry_after_seconds ?? 300);
  const cooldownUntil = Date.now() + cooldownSeconds * 1000;
  if (!result?.allowed) {
    return { success: "Se houver uma conta pendente, enviaremos a confirmação quando o reenvio estiver disponível.", email, cooldownUntil };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${getRedirectOrigin(await headers())}/auth/callback?next=/app` },
  });

  const accountConfirmed = Boolean(error?.message.match(/already confirmed|email confirmed/i));
  return {
    success: error
      ? accountConfirmed
        ? "Esta conta já está confirmada. Use o login ou um Magic Link."
        : "Se houver uma conta pendente, enviaremos a confirmação quando o reenvio estiver disponível."
      : "Se houver uma conta pendente, um novo e-mail de confirmação foi enviado.",
    email: accountConfirmed ? undefined : email,
    cooldownUntil,
    accountConfirmed,
  };
}

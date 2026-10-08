"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, signUpSchema } from "@/lib/validation/auth";
import { getRedirectOrigin } from "@/lib/auth/redirect-url";

export type SignUpState = { error?: string; success?: string; email?: string; cooldownUntil?: number };
export type ResendState = { error?: string; success?: string; email?: string; cooldownUntil?: number; accountConfirmed?: boolean };

const RESEND_COOLDOWN_SECONDS = 300;

function confirmationCooldownUntil() {
  return Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
}

function isExistingConfirmedAccount(user: { identities?: unknown[] | null } | null | undefined) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

function isAlreadyRegisteredError(error: { code?: string; message?: string } | null) {
  return error?.code === "user_already_exists" || error?.code === "email_exists" || /already registered|already exists/i.test(error?.message ?? "");
}

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

  if (error) {
    if (isAlreadyRegisteredError(error)) return { success: "Já existe uma conta com este e-mail. Entre usando sua senha ou um Magic Link." };
    return { error: "Não foi possível criar a conta. Verifique os dados e tente novamente." };
  }
  if (data.session) redirect("/app" as Route);
  if (isExistingConfirmedAccount(data.user)) {
    return { success: "Já existe uma conta com este e-mail. Entre usando sua senha ou um Magic Link." };
  }

  const email = parsed.data.email.toLowerCase();
  const emailHash = createHash("sha256").update(email).digest("hex");
  const { error: claimError } = await supabase.rpc("claim_signup_confirmation_resend", { target_email_hash: emailHash });
  return {
    success: "Este e-mail está pendente de confirmação. Enviamos um link; verifique sua caixa de entrada.",
    email,
    cooldownUntil: claimError ? undefined : confirmationCooldownUntil(),
  };
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

  const accountConfirmed = Boolean(error && (error.code === "user_already_exists" || error.code === "email_exists" || /already confirmed|email confirmed/i.test(error.message ?? "")));
  return {
    error: error && !accountConfirmed ? "Não foi possível reenviar a confirmação. Tente novamente quando o prazo terminar." : undefined,
    success: accountConfirmed
      ? "Já existe uma conta confirmada com este e-mail. Use o login ou um Magic Link."
      : error
        ? undefined
        : "Novo e-mail de confirmação enviado.",
    email: accountConfirmed ? undefined : email,
    cooldownUntil,
    accountConfirmed,
  };
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validation/auth";

export type SignUpState = { error?: string; success?: string };

function getRedirectOrigin(requestHeaders: Headers) {
  const configuredUrl = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;

  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
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

  if (error) return { error: "Não foi possível criar a conta. Verifique os dados e tente novamente." };
  if (data.session) redirect("/app" as Route);

  return { success: "Se o e-mail estiver disponível, enviaremos um link de confirmação." };
}

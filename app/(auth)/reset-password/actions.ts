"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validation/auth";

export type UpdatePasswordState = { error?: string };

export async function updatePassword(_: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const password = formData.get("password");
  const confirmation = formData.get("passwordConfirmation");
  const parsed = passwordSchema.safeParse(password);

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Informe uma senha válida." };
  if (password !== confirmation) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Link expirado. Solicite uma nova recuperação." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error?.code === "same_password") {
    return { error: "Não foi possível definir esta senha. Escolha outra combinação e tente novamente." };
  }
  if (error?.code === "weak_password" || error?.code === "password_too_short") {
    return { error: "Escolha uma senha mais forte, com pelo menos 8 caracteres." };
  }
  if (error) return { error: "Não foi possível atualizar a senha. Solicite um novo link." };

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login" as Route);
}

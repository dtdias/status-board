"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export type ProfileState = { error?: string };
export type SignOutState = { error?: string };
export type DeleteAccountState = { error?: string };

export async function signOutAccount(previousState: SignOutState, formData: FormData): Promise<SignOutState> {
  if (formData.get("intent") !== "sign-out") return previousState;

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) return { error: "Não foi possível sair. Tente novamente." };

  revalidatePath("/app", "layout");
  redirect("/login" as Route);
}

export async function saveProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    area: formData.get("area"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { error } = await supabase.from("profiles").upsert({ id: user.id, ...parsed.data });

  if (error) {
    return { error: "Não foi possível salvar seu perfil." };
  }

  redirect("/app" as Route);
}

export async function deleteAccount(_: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");
  if (typeof password !== "string" || typeof confirmation !== "string" || confirmation !== "EXCLUIR CONTA") {
    return { error: "Confirme a senha e digite EXCLUIR CONTA." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login" as Route);

  const { error: reauthenticationError } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (reauthenticationError) return { error: "Senha atual inválida." };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Sessão expirada. Entre novamente." };

  const { error } = await supabase.functions.invoke("delete-account", {
    body: { confirmation },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) return { error: "Não foi possível excluir a conta. Tente novamente." };

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login" as Route);
}

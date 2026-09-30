"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export type ProfileState = { error?: string };

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

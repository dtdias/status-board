"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { MAX_ROUTINES_PER_FRONT, supportFrontSchema, supportRoutineSchema } from "@/lib/support/support";
import { createClient } from "@/lib/supabase/server";

export type SupportState = { error?: string };

function boardPath(reportId: string) {
  return `/app/reports/${reportId}`;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);
  return supabase;
}

export async function saveSupportFront(_: SupportState, formData: FormData): Promise<SupportState> {
  const reportId = formData.get("reportId");
  const frontId = formData.get("frontId");
  const parsed = supportFrontSchema.safeParse({
    title: formData.get("title"),
    activityType: formData.get("activityType"),
    iconKey: formData.get("iconKey"),
  });

  if (typeof reportId !== "string" || !parsed.success) {
    return { error: parsed.success ? "Relatório inválido." : parsed.error.issues[0]?.message };
  }

  const supabase = await requireUser();
  const values = { title: parsed.data.title, activity_type: parsed.data.activityType, icon_key: parsed.data.iconKey };

  if (typeof frontId === "string" && frontId) {
    const { error } = await supabase.from("support_fronts").update(values).eq("id", frontId).eq("weekly_report_id", reportId);
    if (error) return { error: "Não foi possível atualizar a frente." };
  } else {
    const { data: latest } = await supabase.from("support_fronts").select("position").eq("weekly_report_id", reportId).order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("support_fronts").insert({ ...values, weekly_report_id: reportId, position: (latest?.position ?? -1) + 1 });
    if (error) return { error: "Não foi possível criar a frente." };
  }

  revalidatePath(boardPath(reportId));
  redirect(boardPath(reportId) as Route);
}

export async function deleteSupportFront(formData: FormData) {
  const reportId = formData.get("reportId");
  const frontId = formData.get("frontId");
  if (typeof reportId !== "string" || typeof frontId !== "string") return;

  const supabase = await requireUser();
  const { data: front } = await supabase.from("support_fronts").select("id").eq("id", frontId).eq("weekly_report_id", reportId).maybeSingle();
  if (!front) return;
  const { error: routineError } = await supabase.from("support_routines").delete().eq("support_front_id", front.id);
  if (routineError) return;
  const { error } = await supabase.from("support_fronts").delete().eq("id", front.id).eq("weekly_report_id", reportId);
  if (error) return;
  revalidatePath(boardPath(reportId));
  redirect(boardPath(reportId) as Route);
}

export async function saveSupportRoutine(_: SupportState, formData: FormData): Promise<SupportState> {
  const reportId = formData.get("reportId");
  const frontId = formData.get("frontId");
  const routineId = formData.get("routineId");
  const parsed = supportRoutineSchema.safeParse({ title: formData.get("title") });
  if (typeof reportId !== "string" || typeof frontId !== "string" || !parsed.success) {
    return { error: parsed.success ? "Rotina inválida." : parsed.error.issues[0]?.message };
  }

  const supabase = await requireUser();
  const { data: front } = await supabase.from("support_fronts").select("id").eq("id", frontId).eq("weekly_report_id", reportId).maybeSingle();
  if (!front) return { error: "Frente de sustentação não encontrada." };

  if (typeof routineId === "string" && routineId) {
    const { error } = await supabase.from("support_routines").update({ title: parsed.data.title }).eq("id", routineId).eq("support_front_id", front.id);
    if (error) return { error: "Não foi possível atualizar a rotina." };
  } else {
    const { data: routines } = await supabase.from("support_routines").select("position").eq("support_front_id", front.id).order("position", { ascending: false });
    if ((routines?.length ?? 0) >= MAX_ROUTINES_PER_FRONT) return { error: "Cada frente pode ter no máximo 3 rotinas." };
    const { error } = await supabase.from("support_routines").insert({ support_front_id: front.id, title: parsed.data.title, position: (routines?.[0]?.position ?? -1) + 1 });
    if (error) return { error: "Não foi possível criar a rotina." };
  }

  revalidatePath(boardPath(reportId));
  revalidatePath(`${boardPath(reportId)}/support-fronts/${frontId}`);
  return {};
}

export async function deleteSupportRoutine(formData: FormData) {
  const reportId = formData.get("reportId");
  const frontId = formData.get("frontId");
  const routineId = formData.get("routineId");
  if (typeof reportId !== "string" || typeof frontId !== "string" || typeof routineId !== "string") return;

  const supabase = await requireUser();
  const { data: front } = await supabase.from("support_fronts").select("id").eq("id", frontId).eq("weekly_report_id", reportId).maybeSingle();
  if (!front) return;
  const { error } = await supabase.from("support_routines").delete().eq("id", routineId).eq("support_front_id", front.id);
  if (error) return;
  revalidatePath(boardPath(reportId));
  revalidatePath(`${boardPath(reportId)}/support-fronts/${frontId}`);
}

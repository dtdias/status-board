"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dependencySchema, nextStepSchema } from "@/lib/attention/attention";
import { createClient } from "@/lib/supabase/server";

export type AttentionState = { error?: string };

function boardPath(reportId: string) {
  return `/app/reports/${reportId}`;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);
  return supabase;
}

export async function saveDependency(_: AttentionState, formData: FormData): Promise<AttentionState> {
  const reportId = formData.get("reportId");
  const dependencyId = formData.get("dependencyId");
  const parsed = dependencySchema.safeParse({ title: formData.get("title"), description: formData.get("description"), owner: formData.get("owner"), waitingSince: formData.get("waitingSince"), status: formData.get("status"), hideOwnerInPresentation: formData.get("hideOwnerInPresentation") === "on", hideWaitingSinceInPresentation: formData.get("hideWaitingSinceInPresentation") === "on" });
  if (typeof reportId !== "string" || !parsed.success) return { error: parsed.success ? "Relatório inválido." : parsed.error.issues[0]?.message };

  const supabase = await requireUser();
  const values = { title: parsed.data.title, description: parsed.data.description, owner: parsed.data.owner, waiting_since: parsed.data.waitingSince, status: parsed.data.status, hide_owner_in_presentation: parsed.data.hideOwnerInPresentation, hide_waiting_since_in_presentation: parsed.data.hideWaitingSinceInPresentation };
  if (typeof dependencyId === "string" && dependencyId) {
    const { error } = await supabase.from("dependencies").update(values).eq("id", dependencyId).eq("weekly_report_id", reportId);
    if (error) return { error: "Não foi possível atualizar a dependência." };
  } else {
    const { data: latest } = await supabase.from("dependencies").select("position").eq("weekly_report_id", reportId).order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("dependencies").insert({ ...values, weekly_report_id: reportId, position: (latest?.position ?? -1) + 1 });
    if (error) return { error: "Não foi possível criar a dependência." };
  }
  revalidatePath(boardPath(reportId));
  redirect(boardPath(reportId) as Route);
}

export async function deleteDependency(formData: FormData) {
  const reportId = formData.get("reportId");
  const dependencyId = formData.get("dependencyId");
  if (typeof reportId !== "string" || typeof dependencyId !== "string") return;
  const supabase = await requireUser();
  const { error } = await supabase.from("dependencies").delete().eq("id", dependencyId).eq("weekly_report_id", reportId);
  if (error) return;
  revalidatePath(boardPath(reportId));
  redirect(boardPath(reportId) as Route);
}

export async function saveNextStep(_: AttentionState, formData: FormData): Promise<AttentionState> {
  const reportId = formData.get("reportId");
  const nextStepId = formData.get("nextStepId");
  const parsed = nextStepSchema.safeParse({ title: formData.get("title"), description: formData.get("description"), owner: formData.get("owner"), dueDate: formData.get("dueDate"), hideOwnerInPresentation: formData.get("hideOwnerInPresentation") === "on", hideDueDateInPresentation: formData.get("hideDueDateInPresentation") === "on" });
  if (typeof reportId !== "string" || !parsed.success) return { error: parsed.success ? "Relatório inválido." : parsed.error.issues[0]?.message };

  const supabase = await requireUser();
  const values = { title: parsed.data.title, description: parsed.data.description, owner: parsed.data.owner, due_date: parsed.data.dueDate, hide_owner_in_presentation: parsed.data.hideOwnerInPresentation, hide_due_date_in_presentation: parsed.data.hideDueDateInPresentation };
  if (typeof nextStepId === "string" && nextStepId) {
    const { error } = await supabase.from("next_steps").update(values).eq("id", nextStepId).eq("weekly_report_id", reportId);
    if (error) return { error: "Não foi possível atualizar o próximo passo." };
  } else {
    const { data: latest } = await supabase.from("next_steps").select("position").eq("weekly_report_id", reportId).order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("next_steps").insert({ ...values, weekly_report_id: reportId, position: (latest?.position ?? -1) + 1 });
    if (error) return { error: "Não foi possível criar o próximo passo." };
  }
  revalidatePath(boardPath(reportId));
  redirect(boardPath(reportId) as Route);
}

export async function deleteNextStep(formData: FormData) {
  const reportId = formData.get("reportId");
  const nextStepId = formData.get("nextStepId");
  if (typeof reportId !== "string" || typeof nextStepId !== "string") return;
  const supabase = await requireUser();
  const { error } = await supabase.from("next_steps").delete().eq("id", nextStepId).eq("weekly_report_id", reportId);
  if (error) return;
  revalidatePath(boardPath(reportId));
  redirect(boardPath(reportId) as Route);
}

"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { incidentSchema } from "@/lib/incidents/incident";
import { createClient } from "@/lib/supabase/server";
export type IncidentState = { error?: string };
export async function saveIncident(_: IncidentState, formData: FormData): Promise<IncidentState> {
  const reportId = formData.get("reportId"); const incidentId = formData.get("incidentId");
  const parsed = incidentSchema.safeParse({ affectedSystem: formData.get("affectedSystem"), symptom: formData.get("symptom"), cause: formData.get("cause") || undefined, actionTaken: formData.get("actionTaken"), supportPeople: formData.get("supportPeople") || undefined, status: formData.get("status"), resolvedAt: formData.get("resolvedAt"), iconKey: formData.get("iconKey") });
  if (typeof reportId !== "string" || !parsed.success) return { error: parsed.success ? "Relatório inválido." : parsed.error.issues[0]?.message };
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login" as Route);
  const values = { affected_system: parsed.data.affectedSystem, symptom: parsed.data.symptom, cause: parsed.data.cause || null, action_taken: parsed.data.actionTaken, support_people: parsed.data.supportPeople || null, status: parsed.data.status, resolved_at: parsed.data.resolvedAt || null, icon_key: parsed.data.iconKey };
  if (typeof incidentId === "string" && incidentId) { const { error } = await supabase.from("incidents").update(values).eq("id", incidentId).eq("weekly_report_id", reportId); if (error) return { error: "Não foi possível atualizar o incidente." }; }
  else { const { data: latest } = await supabase.from("incidents").select("position").eq("weekly_report_id", reportId).order("position", { ascending: false }).limit(1).maybeSingle(); const { error } = await supabase.from("incidents").insert({ ...values, weekly_report_id: reportId, position: (latest?.position ?? -1) + 1 }); if (error) return { error: "Não foi possível criar o incidente." }; }
  revalidatePath(`/app/reports/${reportId}`); redirect(`/app/reports/${reportId}` as Route);
}
export async function deleteIncident(formData: FormData) { const reportId = formData.get("reportId"); const incidentId = formData.get("incidentId"); if (typeof reportId !== "string" || typeof incidentId !== "string") return; const supabase = await createClient(); await supabase.from("incidents").delete().eq("id", incidentId).eq("weekly_report_id", reportId); revalidatePath(`/app/reports/${reportId}`); redirect(`/app/reports/${reportId}` as Route); }

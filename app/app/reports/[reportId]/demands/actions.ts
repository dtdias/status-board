"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { demandSchema } from "@/lib/demands/demand";
import { createClient } from "@/lib/supabase/server";

export type DemandState = { error?: string };

export async function saveDemand(_: DemandState, formData: FormData): Promise<DemandState> {
  const reportId = formData.get("reportId");
  const demandId = formData.get("demandId");
  const parsed = demandSchema.safeParse({
    title: formData.get("title"),
    requesterName: formData.get("requesterName"),
    requesterArea: formData.get("requesterArea"),
    involvedAreas: formData.get("involvedAreas"),
    objective: formData.get("objective"),
    statusText: formData.get("statusText"),
    currentPhase: formData.get("currentPhase"),
  });

  if (typeof reportId !== "string" || !parsed.success) {
    return { error: parsed.success ? "Relatório inválido." : "Revise os campos da demanda." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  const values = {
    title: parsed.data.title,
    requester_name: parsed.data.requesterName,
    requester_area: parsed.data.requesterArea,
    involved_areas: parsed.data.involvedAreas.split(",").map((item) => item.trim()).filter(Boolean),
    objective: parsed.data.objective,
    status_text: parsed.data.statusText || null,
    current_phase: parsed.data.currentPhase,
  };

  if (typeof demandId === "string" && demandId) {
    const { error } = await supabase.from("demands").update(values).eq("id", demandId).eq("weekly_report_id", reportId);
    if (error) return { error: "Não foi possível atualizar a demanda." };
  } else {
    const { data: latest } = await supabase
      .from("demands")
      .select("position")
      .eq("weekly_report_id", reportId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("demands").insert({
      ...values,
      weekly_report_id: reportId,
      position: (latest?.position ?? -1) + 1,
    });
    if (error) return { error: "Não foi possível criar a demanda." };
  }

  revalidatePath(`/app/reports/${reportId}`);
  redirect(`/app/reports/${reportId}` as Route);
}

export async function deleteDemand(formData: FormData) {
  const reportId = formData.get("reportId");
  const demandId = formData.get("demandId");
  if (typeof reportId !== "string" || typeof demandId !== "string") return;

  const supabase = await createClient();
  const { error } = await supabase.from("demands").delete().eq("id", demandId).eq("weekly_report_id", reportId);
  if (error) return;

  revalidatePath(`/app/reports/${reportId}`);
  redirect(`/app/reports/${reportId}` as Route);
}

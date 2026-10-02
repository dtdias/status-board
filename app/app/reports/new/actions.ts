"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { weeklyReportSchema } from "@/lib/reports/weekly-report";
import { cloneModes, selectCloneContent } from "@/lib/reports/clone";

export type CreateReportState = { error?: string };

export async function createReport(_: CreateReportState, formData: FormData): Promise<CreateReportState> {
  const parsed = weeklyReportSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    presentationDate: formData.get("presentationDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const cloneMode = cloneModes.includes(formData.get("cloneMode") as (typeof cloneModes)[number])
    ? formData.get("cloneMode") as (typeof cloneModes)[number]
    : "empty";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  let sourceReport: { id: string } | null = null;
  if (cloneMode !== "empty") {
    const { data, error: sourceError } = await supabase
      .from("weekly_reports")
      .select("id")
      .eq("user_id", user.id)
      .lt("start_date", parsed.data.startDate)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sourceError) return { error: "Não foi possível encontrar a semana anterior." };
    sourceReport = data;
  }

  if (cloneMode !== "empty" && !sourceReport) {
    return { error: "Não existe semana anterior para copiar." };
  }

  const sourceId = sourceReport?.id;
  const [deliveries, incidents, demands, supportFronts, dependencies, nextSteps] = sourceId
    ? await Promise.all([
      supabase.from("deliveries").select("title, description, status, icon_key, position").eq("weekly_report_id", sourceId).order("position"),
      supabase.from("incidents").select("affected_system, symptom, cause, action_taken, support_people, status, resolved_at, icon_key, position").eq("weekly_report_id", sourceId).order("position"),
      supabase.from("demands").select("title, requester_name, requester_area, involved_areas, objective, status_text, current_phase, icon_key, position").eq("weekly_report_id", sourceId).order("position"),
      supabase.from("support_fronts").select("id, title, activity_type, icon_key, position").eq("weekly_report_id", sourceId).order("position"),
      supabase.from("dependencies").select("title, description, owner, waiting_since, status, hide_owner_in_presentation, hide_waiting_since_in_presentation, position").eq("weekly_report_id", sourceId).order("position"),
      supabase.from("next_steps").select("title, description, owner, due_date, hide_owner_in_presentation, hide_due_date_in_presentation, position").eq("weekly_report_id", sourceId).order("position"),
    ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if ([deliveries, incidents, demands, supportFronts, dependencies, nextSteps].some((result) => result.error)) {
    return { error: "Não foi possível carregar os itens da semana anterior." };
  }
  const sourceFrontIds = supportFronts.data?.map((front) => front.id) ?? [];
  const { data: supportRoutines, error: supportRoutinesError } = sourceFrontIds.length
    ? await supabase.from("support_routines").select("support_front_id, title, position").in("support_front_id", sourceFrontIds).order("position")
    : { data: [], error: null };
  if (supportRoutinesError) return { error: "Não foi possível carregar os itens da semana anterior." };
  const clone = selectCloneContent(cloneMode, {
    deliveries: deliveries.data ?? [], incidents: incidents.data ?? [], demands: demands.data ?? [], supportFronts: supportFronts.data ?? [], supportRoutines: supportRoutines ?? [], dependencies: dependencies.data ?? [], nextSteps: nextSteps.data ?? [],
  });

  const { data: report, error } = await supabase
    .from("weekly_reports")
    .insert({
      user_id: user.id,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      presentation_date: parsed.data.presentationDate,
    })
    .select("id")
    .single();

  if (error || !report) {
    return { error: "Não foi possível criar a semana." };
  }

  const inserts = [
    clone.deliveries.length ? supabase.from("deliveries").insert(clone.deliveries.map(({ ...item }) => ({ ...item, weekly_report_id: report.id }))) : Promise.resolve({ error: null }),
    clone.incidents.length ? supabase.from("incidents").insert(clone.incidents.map(({ ...item }) => ({ ...item, weekly_report_id: report.id }))) : Promise.resolve({ error: null }),
    clone.demands.length ? supabase.from("demands").insert(clone.demands.map(({ ...item }) => ({ ...item, weekly_report_id: report.id }))) : Promise.resolve({ error: null }),
    clone.dependencies.length ? supabase.from("dependencies").insert(clone.dependencies.map(({ ...item }) => ({ ...item, weekly_report_id: report.id }))) : Promise.resolve({ error: null }),
    clone.nextSteps.length ? supabase.from("next_steps").insert(clone.nextSteps.map(({ ...item }) => ({ ...item, weekly_report_id: report.id }))) : Promise.resolve({ error: null }),
  ];
  const insertResults = await Promise.all(inserts);
  if (insertResults.some((result) => result.error)) return { error: "A semana foi criada, mas não foi possível copiar todos os itens." };

  for (const front of clone.supportFronts) {
    const { data: copiedFront, error: frontError } = await supabase
      .from("support_fronts")
      .insert({ weekly_report_id: report.id, title: front.title, activity_type: front.activity_type, icon_key: front.icon_key, position: front.position })
      .select("id")
      .single();
    if (frontError || !copiedFront) return { error: "A semana foi criada, mas não foi possível copiar a sustentação." };
    const routines = clone.supportRoutines.filter((routine) => routine.support_front_id === front.id);
    if (routines.length) {
      const { error: routineError } = await supabase.from("support_routines").insert(routines.map(({ title, position }) => ({ support_front_id: copiedFront.id, title, position })));
      if (routineError) return { error: "A semana foi criada, mas não foi possível copiar a sustentação." };
    }
  }

  redirect(`/app/reports/${report.id}` as Route);
}

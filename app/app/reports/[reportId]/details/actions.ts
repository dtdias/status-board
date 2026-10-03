"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { reportDetailsSchema } from "@/lib/reports/weekly-report";
import { CONTENT_LIMITS } from "@/lib/validation/report";
import { createClient } from "@/lib/supabase/server";

export type ReportDetailsState = { error?: string };

export type ReportHighlightState = { error?: string; saved?: boolean };

export async function saveReportHighlight(_: ReportHighlightState, formData: FormData): Promise<ReportHighlightState> {
  const reportId = formData.get("reportId");
  const highlight = formData.get("highlight");
  if (typeof reportId !== "string" || typeof highlight !== "string") return { error: "Relatório inválido." };
  const value = highlight.trim();
  if (!value) return { error: "Informe o destaque da semana." };
  if (value.length > CONTENT_LIMITS.highlight) return { error: `O destaque deve ter no máximo ${CONTENT_LIMITS.highlight} caracteres.` };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);
  const { data: report, error } = await supabase.from("weekly_reports").update({ highlight: value }).eq("id", reportId).eq("user_id", user.id).in("status", ["draft", "ready"]).select("id").maybeSingle();
  if (error || !report) return { error: "Não foi possível atualizar o destaque da semana." };
  revalidatePath(`/app/reports/${reportId}`);
  return { saved: true };
}

export async function saveReportDetails(_: ReportDetailsState, formData: FormData): Promise<ReportDetailsState> {
  const reportId = formData.get("reportId");
  const parsed = reportDetailsSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    presentationDate: formData.get("presentationDate"),
    highlight: formData.get("highlight"),
  });

  if (typeof reportId !== "string" || !parsed.success) {
    return { error: parsed.success ? "Relatório inválido." : parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  // Keep the application query scoped; weekly_reports RLS enforces this boundary too.
  const { data: report, error } = await supabase
    .from("weekly_reports")
    .update({
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      presentation_date: parsed.data.presentationDate,
      highlight: parsed.data.highlight,
    })
    .eq("id", reportId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !report) return { error: "Não foi possível atualizar os detalhes do relatório." };

  revalidatePath(`/app/reports/${reportId}`);
  redirect(`/app/reports/${reportId}` as Route);
}

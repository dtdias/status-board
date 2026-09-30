"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { canTransitionReportStatus, reportStatuses, type ReportStatus } from "@/lib/reports/weekly-report";
import { loadPresentationInput, presentationValidationInput } from "@/lib/reports/load-presentation-input";
import { createClient } from "@/lib/supabase/server";
import { validateReport } from "@/lib/validation/report";

export async function transitionReportStatus(formData: FormData) {
  const reportId = formData.get("reportId");
  const target = formData.get("status");
  if (typeof reportId !== "string" || typeof target !== "string" || !reportStatuses.includes(target as ReportStatus)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("status")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!report || !canTransitionReportStatus(report.status, target as ReportStatus)) return;

  if (target === "ready") {
    const input = await loadPresentationInput(supabase, reportId, user.id);
    if (!input || !validateReport(presentationValidationInput(input)).valid) return;
  }

  const { error } = await supabase
    .from("weekly_reports")
    .update({ status: target as ReportStatus })
    .eq("id", reportId)
    .eq("user_id", user.id)
    .eq("status", report.status);
  if (error) return;

  revalidatePath(`/app/reports/${reportId}`);
  redirect(`/app/reports/${reportId}` as Route);
}

"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { weeklyReportSchema } from "@/lib/reports/weekly-report";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

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

  redirect(`/app/reports/${report.id}` as Route);
}

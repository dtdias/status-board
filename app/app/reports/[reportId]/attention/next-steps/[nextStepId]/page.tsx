import { notFound } from "next/navigation";
import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { createClient } from "@/lib/supabase/server";
import { deleteNextStep } from "../../actions";
import { NextStepForm } from "../../attention-forms";

export default async function NextStepPage({ params }: { params: Promise<{ reportId: string; nextStepId: string }> }) {
  const { reportId, nextStepId } = await params;
  const supabase = await createClient();
  const { data: nextStep } = await supabase.from("next_steps").select("id, title, description, owner, due_date, hide_owner_in_presentation, hide_due_date_in_presentation").eq("id", nextStepId).eq("weekly_report_id", reportId).maybeSingle();
  if (!nextStep) notFound();
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Editar próximo passo</p><h1>{nextStep.title}</h1><NextStepForm nextStep={nextStep} reportId={reportId} /><form action={deleteNextStep} className="delete-form"><input name="reportId" type="hidden" value={reportId} /><input name="nextStepId" type="hidden" value={nextStepId} /><button type="submit">Excluir próximo passo</button></form></section></main>;
}

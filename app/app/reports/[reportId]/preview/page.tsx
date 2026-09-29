import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { ReportPreview } from "@/components/preview/report-preview";
import { composePreviewSlides, findPreviewOverflow, type PreviewInput } from "@/lib/preview/compose-slides";
import { createClient } from "@/lib/supabase/server";

export default async function PreviewPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  const { data: report } = await supabase.from("weekly_reports").select("id, start_date, end_date, presentation_date, highlight").eq("id", reportId).eq("user_id", user.id).maybeSingle();
  if (!report) notFound();
  const [{ data: profile }, { data: deliveries }, { data: incidents }, { data: demands }, { data: supportFronts }, { data: dependencies }, { data: nextSteps }] = await Promise.all([
    supabase.from("profiles").select("name, area").eq("id", user.id).maybeSingle(),
    supabase.from("deliveries").select("id, title, description, status, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("incidents").select("id, affected_system, symptom, cause, action_taken, support_people, status, resolved_at, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("demands").select("id, title, requester_name, requester_area, involved_areas, objective, status_text, current_phase, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("support_fronts").select("id, title, activity_type, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("dependencies").select("id, title, description, owner, waiting_since, status, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("next_steps").select("id, title, description, owner, due_date, position").eq("weekly_report_id", reportId).order("position"),
  ]);
  const frontIds = supportFronts?.map((front) => front.id) ?? [];
  const { data: routines } = frontIds.length ? await supabase.from("support_routines").select("id, support_front_id, title, position").in("support_front_id", frontIds).order("position") : { data: [] };
  const input: PreviewInput = {
    report: { id: report.id, name: profile?.name ?? "Apresentador", area: profile?.area ?? "Tecnologia", startDate: report.start_date, endDate: report.end_date, presentationDate: report.presentation_date, highlight: report.highlight },
    deliveries: (deliveries ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, status: item.status, iconKey: item.icon_key })),
    incidents: (incidents ?? []).map((item) => ({ id: item.id, affectedSystem: item.affected_system, symptom: item.symptom, cause: item.cause, actionTaken: item.action_taken, supportPeople: item.support_people, status: item.status, resolvedAt: item.resolved_at, iconKey: item.icon_key })),
    demands: (demands ?? []).map((item) => ({ id: item.id, title: item.title, requesterName: item.requester_name, requesterArea: item.requester_area, involvedAreas: item.involved_areas, objective: item.objective, statusText: item.status_text, currentPhase: item.current_phase, iconKey: item.icon_key })),
    supportFronts: (supportFronts ?? []).map((item) => ({ id: item.id, title: item.title, activityType: item.activity_type, iconKey: item.icon_key, routines: (routines ?? []).filter((routine) => routine.support_front_id === item.id).map((routine) => ({ id: routine.id, title: routine.title })) })),
    dependencies: (dependencies ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, owner: item.owner, waitingSince: item.waiting_since, status: item.status })),
    nextSteps: (nextSteps ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, owner: item.owner, dueDate: item.due_date })),
  };
  return <main className="shell preview-shell"><header className="topbar"><div><Link className="brand board-brand" href={`/app/reports/${reportId}` as Route}>Status Board</Link><p className="eyebrow">Preview HTML/CSS</p><h1>Pré-visualização</h1></div><Link className="outline-button" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link></header><ReportPreview input={input} slides={composePreviewSlides(input)} overflow={findPreviewOverflow(input)} /></main>;
}

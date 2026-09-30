import type { createClient } from "@/lib/supabase/server";
import type { PresentationInput } from "@/lib/pptx/types";
import type { ReportValidationInput } from "@/lib/validation/report";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function loadPresentationInput(supabase: Supabase, reportId: string, userId: string): Promise<PresentationInput | null> {
  const { data: report, error: reportError } = await supabase
    .from("weekly_reports")
    .select("id, start_date, end_date, presentation_date, highlight")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();
  if (reportError) throw new Error("Unable to load report.");
  if (!report) return null;

  const { data: profile, error: profileError } = await supabase.from("profiles").select("name, area").eq("id", userId).maybeSingle();
  if (profileError || !profile) throw new Error("Unable to load report profile.");
  const [deliveriesResult, incidentsResult, demandsResult, frontsResult, dependenciesResult, stepsResult] = await Promise.all([
    supabase.from("deliveries").select("id, title, description, status, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("incidents").select("id, affected_system, symptom, cause, action_taken, support_people, status, resolved_at, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("demands").select("id, title, requester_name, requester_area, involved_areas, objective, status_text, current_phase, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("support_fronts").select("id, title, activity_type, icon_key, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("dependencies").select("id, title, description, owner, waiting_since, status, position").eq("weekly_report_id", reportId).order("position"),
    supabase.from("next_steps").select("id, title, description, owner, due_date, position").eq("weekly_report_id", reportId).order("position"),
  ]);
  if ([deliveriesResult, incidentsResult, demandsResult, frontsResult, dependenciesResult, stepsResult].some((result) => result.error)) throw new Error("Unable to load report content.");

  const fronts = frontsResult.data ?? [];
  const { data: routines, error: routinesError } = fronts.length
    ? await supabase.from("support_routines").select("id, support_front_id, title, position").in("support_front_id", fronts.map((front) => front.id)).order("position")
    : { data: [], error: null };
  if (routinesError) throw new Error("Unable to load support routines.");

  return {
    report: { id: report.id, name: profile.name, area: profile.area, startDate: report.start_date, endDate: report.end_date, presentationDate: report.presentation_date ?? "", highlight: report.highlight ?? "" },
    deliveries: (deliveriesResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, status: item.status, iconKey: item.icon_key, position: item.position })),
    incidents: (incidentsResult.data ?? []).map((item) => ({ id: item.id, affectedSystem: item.affected_system, symptom: item.symptom, cause: item.cause, actionTaken: item.action_taken, supportPeople: item.support_people, status: item.status, resolvedAt: item.resolved_at, iconKey: item.icon_key, position: item.position })),
    demands: (demandsResult.data ?? []).map((item) => ({ id: item.id, title: item.title, requesterName: item.requester_name, requesterArea: item.requester_area, involvedAreas: item.involved_areas, objective: item.objective, statusText: item.status_text, currentPhase: item.current_phase, iconKey: item.icon_key, position: item.position })),
    supportFronts: fronts.map((front) => ({ id: front.id, title: front.title, activityType: front.activity_type, iconKey: front.icon_key, position: front.position, routines: (routines ?? []).filter((routine) => routine.support_front_id === front.id).map((routine) => ({ id: routine.id, title: routine.title, position: routine.position })) })),
    dependencies: (dependenciesResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, owner: item.owner, waitingSince: item.waiting_since, status: item.status, position: item.position })),
    nextSteps: (stepsResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, owner: item.owner, dueDate: item.due_date, position: item.position })),
  };
}

export function presentationValidationInput(input: PresentationInput): ReportValidationInput {
  return {
    report: input.report,
    deliveries: input.deliveries,
    incidents: input.incidents,
    demands: input.demands,
    supportFronts: input.supportFronts,
    dependencies: input.dependencies,
    nextSteps: input.nextSteps,
  };
}

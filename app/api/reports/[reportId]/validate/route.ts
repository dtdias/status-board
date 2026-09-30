import { NextResponse } from "next/server";
import { validateReport, type ReportValidationInput } from "@/lib/validation/report";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: report, error: reportError } = await supabase
    .from("weekly_reports")
    .select("start_date, end_date, presentation_date, highlight")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (reportError) return NextResponse.json({ error: "Unable to load report." }, { status: 500 });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [deliveriesResult, incidentsResult, demandsResult, supportFrontsResult, dependenciesResult, nextStepsResult] = await Promise.all([
    supabase.from("deliveries").select("id, title, description, status").eq("weekly_report_id", reportId),
    supabase.from("incidents").select("id, affected_system, symptom, cause, action_taken, status, resolved_at").eq("weekly_report_id", reportId),
    supabase.from("demands").select("id, title, requester_name, requester_area, involved_areas, objective, status_text, current_phase").eq("weekly_report_id", reportId),
    supabase.from("support_fronts").select("id, title, activity_type").eq("weekly_report_id", reportId),
    supabase.from("dependencies").select("id, title, description, owner, waiting_since").eq("weekly_report_id", reportId),
    supabase.from("next_steps").select("id, title, description").eq("weekly_report_id", reportId),
  ]);
  const queries = [deliveriesResult, incidentsResult, demandsResult, supportFrontsResult, dependenciesResult, nextStepsResult];
  if (queries.some((result) => result.error)) return NextResponse.json({ error: "Unable to load report content." }, { status: 500 });

  const supportFronts = supportFrontsResult.data ?? [];
  const frontIds = supportFronts.map((front) => front.id);
  const { data: routines, error: routinesError } = frontIds.length
    ? await supabase.from("support_routines").select("id, support_front_id, title").in("support_front_id", frontIds)
    : { data: [], error: null };
  if (routinesError) return NextResponse.json({ error: "Unable to load support routines." }, { status: 500 });

  const input: ReportValidationInput = {
    report: { startDate: report.start_date, endDate: report.end_date, presentationDate: report.presentation_date, highlight: report.highlight },
    deliveries: (deliveriesResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, status: item.status })),
    incidents: (incidentsResult.data ?? []).map((item) => ({ id: item.id, affectedSystem: item.affected_system, symptom: item.symptom, cause: item.cause, actionTaken: item.action_taken, status: item.status, resolvedAt: item.resolved_at })),
    demands: (demandsResult.data ?? []).map((item) => ({ id: item.id, title: item.title, requesterName: item.requester_name, requesterArea: item.requester_area, involvedAreas: item.involved_areas, objective: item.objective, statusText: item.status_text, currentPhase: item.current_phase })),
    supportFronts: supportFronts.map((front) => ({ id: front.id, title: front.title, activityType: front.activity_type, routines: (routines ?? []).filter((routine) => routine.support_front_id === front.id).map((routine) => ({ id: routine.id, title: routine.title })) })),
    dependencies: (dependenciesResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description, owner: item.owner, waitingSince: item.waiting_since })),
    nextSteps: (nextStepsResult.data ?? []).map((item) => ({ id: item.id, title: item.title, description: item.description })),
  };

  return NextResponse.json(validateReport(input));
}

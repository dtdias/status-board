import { notFound } from "next/navigation";
import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { createClient } from "@/lib/supabase/server";
import { deleteSupportFront, deleteSupportRoutine } from "../actions";
import { RoutineForm } from "../routine-form";
import { SupportFrontForm } from "../support-front-form";

export default async function SupportFrontPage({ params }: { params: Promise<{ reportId: string; frontId: string }> }) {
  const { reportId, frontId } = await params;
  const supabase = await createClient();
  const { data: front } = await supabase.from("support_fronts").select("id, title, activity_type, icon_key").eq("id", frontId).eq("weekly_report_id", reportId).maybeSingle();
  if (!front) notFound();
  const { data: routines } = await supabase.from("support_routines").select("id, title, position").eq("support_front_id", front.id).order("position");

  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Editar sustentação</p><h1>{front.title}</h1><SupportFrontForm front={front} reportId={reportId} /><section className="routines"><h2>Rotinas</h2>{routines?.map((routine) => <div className="routine-row" key={routine.id}><RoutineForm frontId={front.id} reportId={reportId} routine={routine} /><form action={deleteSupportRoutine}><input name="reportId" type="hidden" value={reportId} /><input name="frontId" type="hidden" value={front.id} /><input name="routineId" type="hidden" value={routine.id} /><button className="text-delete" type="submit">Excluir</button></form></div>)}{(routines?.length ?? 0) < 3 ? <RoutineForm frontId={front.id} reportId={reportId} /> : <p className="routine-limit">Limite de 3 rotinas por frente.</p>}</section><form action={deleteSupportFront} className="delete-form"><input name="reportId" type="hidden" value={reportId} /><input name="frontId" type="hidden" value={front.id} /><button type="submit">Excluir frente</button></form></section></main>;
}

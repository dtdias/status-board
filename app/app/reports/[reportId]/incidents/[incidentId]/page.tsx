import { notFound } from "next/navigation";
import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { createClient } from "@/lib/supabase/server";
import { deleteIncident } from "../actions";
import { IncidentForm } from "../incident-form";
export default async function IncidentPage({ params }: { params: Promise<{ reportId: string; incidentId: string }> }) { const { reportId, incidentId } = await params; const supabase = await createClient(); const { data: incident } = await supabase.from("incidents").select("id, affected_system, symptom, cause, action_taken, support_people, status, resolved_at, icon_key").eq("id", incidentId).eq("weekly_report_id", reportId).maybeSingle(); if (!incident) notFound(); return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Editar incidente</p><h1>{incident.affected_system}</h1><IncidentForm incident={incident} reportId={reportId} /><form action={deleteIncident} className="delete-form"><input name="reportId" type="hidden" value={reportId} /><input name="incidentId" type="hidden" value={incidentId} /><button type="submit">Excluir incidente</button></form></section></main>; }

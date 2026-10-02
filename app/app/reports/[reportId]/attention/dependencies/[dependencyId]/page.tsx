import { notFound } from "next/navigation";
import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { createClient } from "@/lib/supabase/server";
import { deleteDependency } from "../../actions";
import { DependencyForm } from "../../attention-forms";

export default async function DependencyPage({ params }: { params: Promise<{ reportId: string; dependencyId: string }> }) {
  const { reportId, dependencyId } = await params;
  const supabase = await createClient();
  const { data: dependency } = await supabase.from("dependencies").select("id, title, description, owner, waiting_since, status, hide_owner_in_presentation, hide_waiting_since_in_presentation").eq("id", dependencyId).eq("weekly_report_id", reportId).maybeSingle();
  if (!dependency) notFound();
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Editar dependência</p><h1>{dependency.title}</h1><DependencyForm dependency={dependency} reportId={reportId} /><form action={deleteDependency} className="delete-form"><input name="reportId" type="hidden" value={reportId} /><input name="dependencyId" type="hidden" value={dependencyId} /><button type="submit">Excluir dependência</button></form></section></main>;
}

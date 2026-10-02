import type { Route } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/navigation/back-link";
import { createClient } from "@/lib/supabase/server";
import { deleteDemand } from "../actions";
import { DemandForm } from "../demand-form";

export default async function DemandPage({ params }: { params: Promise<{ reportId: string; demandId: string }> }) {
  const { reportId, demandId } = await params;
  const supabase = await createClient();
  const { data: demand } = await supabase
    .from("demands")
    .select("id, title, requester_name, requester_area, involved_areas, objective, status_text, current_phase")
    .eq("id", demandId)
    .eq("weekly_report_id", reportId)
    .maybeSingle();

  if (!demand) notFound();

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" />
        <DemandForm demand={demand} reportId={reportId} />
        <form action={deleteDemand} className="delete-form">
          <input name="reportId" type="hidden" value={reportId} />
          <input name="demandId" type="hidden" value={demandId} />
          <button type="submit">Excluir demanda</button>
        </form>
      </section>
    </main>
  );
}

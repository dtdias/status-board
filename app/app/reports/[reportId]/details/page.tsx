import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReportDetailsForm } from "./report-details-form";

export default async function ReportDetailsPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("weekly_reports")
    .select("start_date, end_date, presentation_date, highlight")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) notFound();

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link>
        <p className="eyebrow">Relatório semanal</p>
        <h1>Editar detalhes</h1>
        <ReportDetailsForm report={report} reportId={reportId} />
      </section>
    </main>
  );
}

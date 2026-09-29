import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { formatWeekRange } from "@/lib/reports/weekly-report";
import { createClient } from "@/lib/supabase/server";

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id, start_date, end_date, presentation_date")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    notFound();
  }

  return (
    <main className="shell">
      <Link className="brand" href={"/app" as Route}>Status Board</Link>
      <p className="eyebrow">Semana criada</p>
      <h1>{formatWeekRange(report.start_date, report.end_date)}</h1>
      <p className="intro-copy">Apresentação em {report.presentation_date}. O board será adicionado na próxima etapa.</p>
    </main>
  );
}

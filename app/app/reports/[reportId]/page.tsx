import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { formatWeekRange } from "@/lib/reports/weekly-report";
import { createClient } from "@/lib/supabase/server";
import { deliveryStatusMeta } from "@/lib/deliveries/delivery";

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

  const { data: deliveries } = await supabase.from("deliveries").select("id, title, description, status, icon_key, position").eq("weekly_report_id", reportId).order("position");

  return (
    <main className="shell">
      <header className="topbar"><div><Link className="brand board-brand" href={"/app" as Route}>Status Board</Link><p className="eyebrow">Apresentação em {report.presentation_date}</p><h1>{formatWeekRange(report.start_date, report.end_date)}</h1></div><Link className="outline-button" href={`/app/reports/${reportId}/deliveries/new` as Route}>Nova entrega</Link></header>
      <section className="board report-board" aria-label="Board semanal">
        <article className="board-column deliveries-column"><div className="column-heading"><span className="status-dot green" /><h3>Entregas</h3><span className="count">{deliveries?.length ?? 0}</span></div>{deliveries?.length ? <div className="delivery-stack">{deliveries.map((delivery) => <Link className="delivery-card" href={`/app/reports/${reportId}/deliveries/${delivery.id}` as Route} key={delivery.id}><span className="delivery-icon">{delivery.icon_key.slice(0, 1).toUpperCase()}</span><strong>{delivery.title}</strong><p>{delivery.description}</p><span className="delivery-status" style={{ background: deliveryStatusMeta[delivery.status].color }}>{deliveryStatusMeta[delivery.status].label}</span></Link>)}</div> : <div className="empty-state"><span className="empty-mark">+</span><p>Sem ocorrências na semana.</p><Link href={`/app/reports/${reportId}/deliveries/new` as Route}>Adicionar entrega</Link></div>}</article>
        {[["Incidentes", "red"], ["Demandas", "yellow"], ["Sustentação", "blue"], ["Atenção", "orange"]].map(([label, tone]) => <article className="board-column" key={label}><div className="column-heading"><span className={`status-dot ${tone}`} /><h3>{label}</h3><span className="count">0</span></div><div className="empty-state"><p>Em breve</p></div></article>)}
      </section>
    </main>
  );
}

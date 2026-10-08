import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { formatWeekRange, reportStatusDashboardAction, reportStatusFromSearchParam, reportStatusLabel, reportStatusNextStep, reportStatuses, type ReportStatus } from "@/lib/reports/weekly-report";
import { createClient } from "@/lib/supabase/server";
import { getTemplateAdminAccess } from "@/lib/auth/template-admin";
import { ProfileForm } from "./profile-form";

export default async function AppPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, area")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">Configuração inicial</p>
          <h1>Antes, nos conte quem você é.</h1>
          <p className="intro-copy">Seu nome e área aparecem na capa do status semanal.</p>
          <ProfileForm />
        </section>
      </main>
    );
  }

  const selectedStatus = reportStatusFromSearchParam((await searchParams).status);
  const reportsQuery = supabase
    .from("weekly_reports")
    .select("id, start_date, end_date, presentation_date, status")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false });
  const { isAdmin } = await getTemplateAdminAccess(supabase);
  const [{ data: statusRows }, { data: reports }] = await Promise.all([
    supabase.from("weekly_reports").select("status").eq("user_id", user.id),
    selectedStatus ? reportsQuery.eq("status", selectedStatus) : reportsQuery,
  ]);
  const reportCounts = (statusRows ?? []).reduce<Record<ReportStatus, number>>(
    (counts, report) => ({ ...counts, [report.status]: counts[report.status] + 1 }),
    { draft: 0, ready: 0, generated: 0, presented: 0, archived: 0 },
  );
  const totalReports = statusRows?.length ?? 0;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{profile.area}</p>
          <h1>Olá, {profile.name}.</h1>
        </div>
        <div className="topbar-actions">
          <Link className="text-link" href={"/app/settings" as Route}>Perfil</Link>
          {isAdmin ? <Link className="text-link" href={"/app/admin/templates" as Route}>Templates</Link> : null}
          <Link className="outline-button" data-tour="new-week" href={"/app/reports/new" as Route}>Nova semana</Link>
        </div>
      </header>
      <section className="report-list" aria-labelledby="reports-heading">
        <div className="report-list-heading">
          <div>
          <p className="eyebrow">Relatórios</p>
            <h2 id="reports-heading">Suas semanas</h2>
          </div>
          <p className="report-total"><strong>{totalReports}</strong> {totalReports === 1 ? "relatório" : "relatórios"}</p>
        </div>
        <div className="report-toolbar">
          <form className="report-filter" action="/app">
            <label htmlFor="report-status">Filtrar por status</label>
            <select defaultValue={selectedStatus ?? ""} id="report-status" name="status">
              <option value="">Todos os status ({totalReports})</option>
              {reportStatuses.map((status) => <option key={status} value={status}>{reportStatusLabel(status)} ({reportCounts[status]})</option>)}
            </select>
            <button className="outline-button" type="submit">Filtrar</button>
          </form>
          {selectedStatus ? <Link className="text-link" href={"/app" as Route}>Limpar filtro</Link> : null}
        </div>
        {reports?.length ? (
          <div className="reports">
            {reports.map((report) => (
              <Link className="report-card" href={`/app/reports/${report.id}` as Route} key={report.id}>
                <span className={`status-chip status-chip-${report.status}`}>{reportStatusLabel(report.status)}</span>
                <strong>{formatWeekRange(report.start_date, report.end_date)}</strong>
                <span>Apresentação: {report.presentation_date}</span>
                <span className="report-next-step">{reportStatusNextStep(report.status)}</span>
                <span className="report-card-link">{reportStatusDashboardAction(report.status)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-reports">
            <p>{selectedStatus ? `Nenhum relatório com status ${reportStatusLabel(selectedStatus).toLowerCase()}.` : "Nenhuma semana criada."}</p>
            {selectedStatus ? <Link className="outline-button" href={"/app" as Route}>Ver todos os relatórios</Link> : <Link className="primary-button" data-tour="new-week" href={"/app/reports/new" as Route}>Criar primeira semana</Link>}
          </div>
        )}
      </section>
    </main>
  );
}

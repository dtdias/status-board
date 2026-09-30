import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { formatWeekRange } from "@/lib/reports/weekly-report";
import { createClient } from "@/lib/supabase/server";
import { getTemplateAdminAccess } from "@/lib/auth/template-admin";
import { ProfileForm } from "./profile-form";

export default async function AppPage() {
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
          <h1>Antes, conte quem apresenta.</h1>
          <p className="intro-copy">Seu nome e área aparecem na capa do status semanal.</p>
          <ProfileForm />
        </section>
      </main>
    );
  }

  const { isAdmin } = await getTemplateAdminAccess(supabase);

  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("id, start_date, end_date, presentation_date, status")
    .order("start_date", { ascending: false });

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
          <Link className="outline-button" href={"/app/reports/new" as Route}>Nova semana</Link>
        </div>
      </header>
      <section className="report-list" aria-labelledby="reports-heading">
        <div>
          <p className="eyebrow">Relatórios</p>
          <h2 id="reports-heading">Suas semanas</h2>
        </div>
        {reports?.length ? (
          <div className="reports">
            {reports.map((report) => (
              <Link className="report-card" href={`/app/reports/${report.id}` as Route} key={report.id}>
                <span className="eyebrow">{report.status}</span>
                <strong>{formatWeekRange(report.start_date, report.end_date)}</strong>
                <span>Apresentação: {report.presentation_date}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-reports">
            <p>Nenhuma semana criada.</p>
            <Link className="primary-button" href={"/app/reports/new" as Route}>Criar primeira semana</Link>
          </div>
        )}
      </section>
    </main>
  );
}

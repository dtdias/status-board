import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { formatWeekRange } from "@/lib/reports/weekly-report";
import { ReportIcon } from "@/components/report-icon";
import { createClient } from "@/lib/supabase/server";
import { incidentStatusMeta } from "@/lib/incidents/incident";
import { demandPhaseLabels, demandPhases, phaseTone } from "@/lib/demands/demand";
import { calculateReportSummary } from "@/lib/reports/summary";
import { listGeneratedPresentations, type GeneratedPresentation } from "@/lib/storage/generated-presentation";
import { BoardColumn } from "./board-column";
import { DeliverySortableList } from "./delivery-sortable-list";
import { GeneratePresentation } from "./generate-presentation";
import { PresentationHistory } from "./presentation-history";
import { ReportStatusActions } from "./report-status-actions";
import { ReportHighlight } from "./report-highlight";

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("id, start_date, end_date, presentation_date, highlight, status")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    notFound();
  }

  const { data: deliveries } = await supabase.from("deliveries").select("id, title, description, status, icon_key, position").eq("weekly_report_id", reportId).order("position");
  const { data: incidents } = await supabase.from("incidents").select("id, affected_system, symptom, status, resolved_at, icon_key, position").eq("weekly_report_id", reportId).order("position");
  const { data: demands } = await supabase.from("demands").select("id, title, current_phase, icon_key").eq("weekly_report_id", reportId).order("position");
  const { data: supportFronts } = await supabase.from("support_fronts").select("id, title, activity_type, icon_key, position").eq("weekly_report_id", reportId).order("position");
  const { data: dependencies } = await supabase.from("dependencies").select("id, title, description, owner, waiting_since, status, position").eq("weekly_report_id", reportId).order("position");
  const { data: nextSteps } = await supabase.from("next_steps").select("id, title, description, owner, due_date, position").eq("weekly_report_id", reportId).order("position");
  let presentations: GeneratedPresentation[] = [];
  let presentationHistoryError: string | null = null;
  try {
    presentations = await listGeneratedPresentations(supabase, reportId);
  } catch {
    presentationHistoryError = "Não foi possível carregar o histórico de apresentações. Atualize a página para tentar novamente.";
  }
  const supportFrontIds = supportFronts?.map((front) => front.id) ?? [];
  const { data: supportRoutines } = supportFrontIds.length
    ? await supabase.from("support_routines").select("id, support_front_id, title, position").in("support_front_id", supportFrontIds).order("position")
    : { data: [] };
  const summary = calculateReportSummary({
    deliveries: deliveries ?? [],
    incidents: incidents ?? [],
    demands: demands ?? [],
    supportFronts: (supportFronts ?? []).map((front) => ({
      routines: (supportRoutines ?? []).filter((routine) => routine.support_front_id === front.id),
    })),
  });

  const isArchived = report.status === "archived";
  const isEditable = report.status === "draft" || report.status === "ready";

  return (
    <main className="shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">Apresentação em {report.presentation_date}</p>
          <h1>{formatWeekRange(report.start_date, report.end_date)}</h1>
        </div>
        <div className="report-actions">
          <div className="action-group action-group-navigation">
            <BackLink href={"/app" as Route} label="Voltar às semanas" />
            {isEditable ? <Link className="outline-button" href={`/app/reports/${reportId}/details` as Route}>Editar detalhes</Link> : null}
            <Link className="outline-button" href={`/app/reports/${reportId}/preview` as Route}>Pré-visualizar</Link>
          </div>
          {report.status === "ready" ? <GeneratePresentation reportId={reportId} /> : null}
          <ReportStatusActions reportId={reportId} status={report.status} />
        </div>
      </header>
      {isArchived ? <p className="form-success" role="status">Este relatório está arquivado e disponível somente para consulta e download.</p> : null}
      <section className="report-summary" aria-label="Resumo automático da semana">
        <p className="eyebrow">Resumo automático</p>
        <dl className="summary-metrics">
          <div><dt>Entregas</dt><dd>{summary.deliveries}</dd></div>
          <div><dt>Incidentes resolvidos</dt><dd>{summary.resolvedIncidents}</dd></div>
          <div><dt>Demandas novas</dt><dd>{summary.newDemands}</dd></div>
          <div><dt>Rotinas de sustentação</dt><dd>{summary.supportRoutines}</dd></div>
        </dl>
      </section>
      <ReportHighlight editable={isEditable} highlight={report.highlight} reportId={reportId} />
      {presentationHistoryError ? <p className="form-error" role="alert">{presentationHistoryError}</p> : <PresentationHistory presentations={presentations} reportId={reportId} />}
      <section className="board report-board" aria-label="Board semanal" inert={isArchived ? true : undefined}>
        <BoardColumn
          title="Entregas"
          headingId="deliveries-heading"
          statusClassName="green"
          count={deliveries?.length ?? 0}
          countLabel={`${deliveries?.length ?? 0} entregas`}
          emptyMessage="Sem ocorrências na semana."
          emptyMark
          addHref={`/app/reports/${reportId}/deliveries/new` as Route}
          addLabel="Adicionar entrega"
          className="deliveries-column"
        >
          {deliveries?.length ? <DeliverySortableList deliveries={deliveries} reportId={reportId} /> : null}
        </BoardColumn>
        <BoardColumn
          title="Incidentes"
          headingId="incidents-heading"
          statusClassName="red"
          count={incidents?.length ?? 0}
          countLabel={`${incidents?.length ?? 0} incidentes`}
          emptyMessage="Sem incidentes na semana."
          addHref={`/app/reports/${reportId}/incidents/new` as Route}
          addLabel="Adicionar incidente"
        >
          <div className="delivery-stack">
            {incidents?.map((incident) => (
              <Link className="delivery-card" href={`/app/reports/${reportId}/incidents/${incident.id}` as Route} key={incident.id}>
                <ReportIcon className="delivery-icon" iconKey={incident.icon_key} />
                <strong>{incident.affected_system}</strong>
                <p>{incident.symptom}</p>
                <span className="delivery-status" style={{ background: incidentStatusMeta[incident.status].color }}>
                  {incidentStatusMeta[incident.status].label}{incident.resolved_at ? ` · ${incident.resolved_at}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </BoardColumn>
        <BoardColumn
          title="Demandas"
          headingId="demands-heading"
          statusClassName="yellow"
          count={demands?.length ?? 0}
          countLabel={`${demands?.length ?? 0} demandas`}
          emptyMessage="Sem ocorrências na semana."
          addHref={`/app/reports/${reportId}/demands/new` as Route}
          addLabel="Adicionar demanda"
        >
          <div className="delivery-stack">
            {demands?.map((demand) => (
              <Link className="delivery-card" href={`/app/reports/${reportId}/demands/${demand.id}` as Route} key={demand.id}>
                <ReportIcon className="delivery-icon" iconKey={demand.icon_key} />
                <strong>{demand.title}</strong>
                <div className="phase-line" role="img" aria-label={`Fase atual: ${demandPhaseLabels[demandPhases.indexOf(demand.current_phase)]}`}>
                  {demandPhases.map((phase) => <span className={phaseTone(phase, demand.current_phase)} key={phase} />)}
                </div>
              </Link>
            ))}
          </div>
        </BoardColumn>
        <BoardColumn
          title="Rotinas de Sustentação"
          headingId="support-heading"
          statusClassName="blue"
          count={supportFronts?.length ?? 0}
          countLabel={`${supportFronts?.length ?? 0} frentes de sustentação`}
          emptyMessage="Sem ocorrências na semana."
          addHref={`/app/reports/${reportId}/support-fronts/new` as Route}
          addLabel="Adicionar frente"
        >
          <div className="delivery-stack">
            {supportFronts?.map((front) => {
              const routines = supportRoutines?.filter((routine) => routine.support_front_id === front.id) ?? [];
              return (
                <Link className="delivery-card support-card" href={`/app/reports/${reportId}/support-fronts/${front.id}` as Route} key={front.id}>
                  <ReportIcon className="delivery-icon" iconKey={front.icon_key} />
                  <strong>{front.title}</strong>
                  <p>{front.activity_type}</p>
                  <span className="routine-count">{routines.length}/3 rotinas</span>
                  {routines.length ? <ul>{routines.map((routine) => <li key={routine.id}>{routine.title}</li>)}</ul> : null}
                </Link>
              );
            })}
          </div>
        </BoardColumn>
        <details className="board-column attention-column" aria-labelledby="attention-heading" open>
          <summary className="column-heading">
            <span className="status-dot orange" aria-hidden="true" />
            <span className="column-title" id="attention-heading" role="heading" aria-level={3}>Atenção</span>
            <span className="count" aria-label={`${(dependencies?.length ?? 0) + (nextSteps?.length ?? 0)} itens de atenção`}>{(dependencies?.length ?? 0) + (nextSteps?.length ?? 0)}</span>
          </summary>
          <div className="attention-stack">
            <h4 className="attention-label">Dependências</h4>
            {dependencies?.map((dependency) => (
              <Link className="delivery-card attention-card" href={`/app/reports/${reportId}/attention/dependencies/${dependency.id}` as Route} key={dependency.id}>
                <strong>{dependency.title}</strong>
                <p>{dependency.description}</p>
                <span>Responsável: {dependency.owner}</span>
                <span>Desde: {dependency.waiting_since}</span>
                {dependency.status ? <span className="attention-status">{dependency.status}</span> : null}
              </Link>
            ))}
            {dependencies?.length ? null : <p className="attention-empty">Nenhuma dependência.</p>}
            <Link className="attention-add" href={`/app/reports/${reportId}/attention/dependencies/new` as Route}>Adicionar dependência</Link>
            <h4 className="attention-label">Próximos passos</h4>
            {nextSteps?.map((nextStep) => (
              <Link className="delivery-card attention-card" href={`/app/reports/${reportId}/attention/next-steps/${nextStep.id}` as Route} key={nextStep.id}>
                <strong>{nextStep.title}</strong>
                {nextStep.description ? <p>{nextStep.description}</p> : null}
                {nextStep.owner ? <span>Responsável: {nextStep.owner}</span> : null}
                {nextStep.due_date ? <span>Prazo: {nextStep.due_date}</span> : null}
              </Link>
            ))}
            {nextSteps?.length ? null : <p className="attention-empty">Nenhum próximo passo.</p>}
            <Link className="attention-add" href={`/app/reports/${reportId}/attention/next-steps/new` as Route}>Adicionar próximo passo</Link>
          </div>
        </details>
      </section>
    </main>
  );
}

import { reportStatusLabel, type ReportStatus } from "@/lib/reports/weekly-report";
import { transitionReportStatus } from "./status-actions";

const actions: Record<ReportStatus, { status: ReportStatus; label: string; className: string }[]> = {
  draft: [{ status: "ready", label: "Marcar como pronto", className: "outline-button" }],
  ready: [{ status: "draft", label: "Voltar ao rascunho", className: "outline-button" }],
  generated: [{ status: "ready", label: "Editar relatório", className: "outline-button" }, { status: "presented", label: "Marcar como apresentado", className: "outline-button" }, { status: "archived", label: "Arquivar", className: "outline-button" }],
  presented: [{ status: "archived", label: "Arquivar", className: "outline-button" }],
  archived: [],
};

export function ReportStatusActions({ reportId, status }: { reportId: string; status: ReportStatus }) {
  return <div className="actions" aria-label="Status do relatório">
    <span className="eyebrow">Status: {reportStatusLabel(status)}</span>
    {actions[status].map((action) => <form action={transitionReportStatus} key={action.status}><input name="reportId" type="hidden" value={reportId} /><input name="status" type="hidden" value={action.status} /><button className={action.className} type="submit">{action.label}</button></form>)}
  </div>;
}

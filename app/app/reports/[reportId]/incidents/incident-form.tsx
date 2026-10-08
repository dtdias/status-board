"use client";

import { useActionState } from "react";
import { ReportIconPicker } from "@/components/report-icon-picker";
import { incidentIcons, incidentStatusMeta, incidentStatuses } from "@/lib/incidents/incident";
import { saveIncident, type IncidentState } from "./actions";

type Incident = { id: string; affected_system: string; symptom: string; cause: string | null; action_taken: string; support_people: string | null; status: keyof typeof incidentStatusMeta; resolved_at: string | null; icon_key: string };
const initialState: IncidentState = {};

export function IncidentForm({ reportId, incident }: { reportId: string; incident?: Incident }) {
  const [state, action, pending] = useActionState(saveIncident, initialState);
  return <form action={action} className="auth-form">
    <input name="reportId" type="hidden" value={reportId} />
    {incident && <input name="incidentId" type="hidden" value={incident.id} />}
    <label>Sistema afetado<input data-tour="form-incident-system" defaultValue={incident?.affected_system} name="affectedSystem" required /></label>
    <label>O que aconteceu<textarea data-tour="form-incident-symptom" defaultValue={incident?.symptom} name="symptom" required rows={3} /></label>
    <label>Causa<textarea data-tour="form-incident-cause" defaultValue={incident?.cause ?? ""} name="cause" rows={2} /></label>
    <label>Ação tomada<textarea data-tour="form-incident-action" defaultValue={incident?.action_taken} name="actionTaken" required rows={3} /></label>
    <label>Pessoas de suporte<input data-tour="form-incident-support" defaultValue={incident?.support_people ?? ""} name="supportPeople" /></label>
    <label>Status<select data-tour="form-incident-status" defaultValue={incident?.status ?? "resolved"} name="status">{incidentStatuses.map((status) => <option key={status} value={status}>{incidentStatusMeta[status].label}</option>)}</select></label>
    <label>Data de resolução<input defaultValue={incident?.resolved_at ?? ""} name="resolvedAt" type="date" /></label>
    <ReportIconPicker dataTour="form-incident-icon" defaultValue={incident?.icon_key ?? "incident"} label="Ícone" name="iconKey" options={incidentIcons} />
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="primary-button" data-tour="form-incident-submit" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar incidente"}</button>
  </form>;
}

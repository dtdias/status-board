"use client";

import { useActionState } from "react";
import { demandPhaseLabels, demandPhases } from "@/lib/demands/demand";
import { saveDemand, type DemandState } from "./actions";

type Demand = {
  id: string;
  title: string;
  requester_name: string;
  requester_area: string;
  involved_areas: string[];
  objective: string;
  status_text: string | null;
  current_phase: (typeof demandPhases)[number];
};

const initialState: DemandState = {};

export function DemandForm({ reportId, demand }: { reportId: string; demand?: Demand }) {
  const [state, formAction, pending] = useActionState(saveDemand, initialState);

  return (
    <form action={formAction} className="auth-form">
      <input name="reportId" type="hidden" value={reportId} />
      {demand ? <input name="demandId" type="hidden" value={demand.id} /> : null}
      <p className="eyebrow">{demand ? "Editar demanda" : "Nova demanda"}</p>
      <h1>{demand ? demand.title : "O que foi solicitado?"}</h1>
      <label>Título<input data-tour="form-demand-title" defaultValue={demand?.title} maxLength={60} name="title" required /></label>
      <label>Solicitante<input data-tour="form-demand-requester" defaultValue={demand?.requester_name} name="requesterName" required /></label>
      <label>Área solicitante<input data-tour="form-demand-area" defaultValue={demand?.requester_area} name="requesterArea" required /></label>
      <label>Áreas envolvidas<input data-tour="form-demand-involved" defaultValue={demand?.involved_areas.join(", ")} name="involvedAreas" /></label>
      <label>Objetivo<textarea data-tour="form-demand-objective" defaultValue={demand?.objective} maxLength={220} name="objective" required rows={4} /></label>
      <label>Status<input data-tour="form-demand-status" defaultValue={demand?.status_text ?? ""} maxLength={100} name="statusText" /></label>
      <label>
        Fase
        <select data-tour="form-demand-phase" defaultValue={demand?.current_phase ?? "request_received"} name="currentPhase">
          {demandPhases.map((phase, index) => <option key={phase} value={phase}>{demandPhaseLabels[index]}</option>)}
        </select>
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" data-tour="form-demand-submit" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar demanda"}</button>
    </form>
  );
}

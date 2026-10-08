"use client";

import { useActionState } from "react";
import { ReportIconPicker } from "@/components/report-icon-picker";
import { supportIcons } from "@/lib/support/support";
import { saveSupportFront, type SupportState } from "./actions";

type SupportFront = { id: string; title: string; activity_type: string; icon_key: string };
const initialState: SupportState = {};

export function SupportFrontForm({ reportId, front }: { reportId: string; front?: SupportFront }) {
  const [state, formAction, pending] = useActionState(saveSupportFront, initialState);
  return <form action={formAction} className="auth-form">
    <input name="reportId" type="hidden" value={reportId} />
    {front ? <input name="frontId" type="hidden" value={front.id} /> : null}
    <label>Nome da frente<input data-tour="form-support-title" defaultValue={front?.title} maxLength={50} name="title" required /></label>
    <label>Tipo da atividade<input data-tour="form-support-activity" defaultValue={front?.activity_type} maxLength={80} name="activityType" required /></label>
    <ReportIconPicker dataTour="form-support-icon" defaultValue={front?.icon_key ?? "routine"} label="Ícone" name="iconKey" options={supportIcons} />
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <button className="primary-button" data-tour="form-support-submit" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar frente"}</button>
  </form>;
}

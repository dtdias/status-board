"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveReportHighlight, type ReportHighlightState } from "./details/actions";

const initialState: ReportHighlightState = {};

export function ReportHighlight({ reportId, highlight, editable }: { reportId: string; highlight: string | null; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveReportHighlight, initialState);
  const value = highlight?.trim() || "Destaque ainda não informado.";

  useEffect(() => {
    if (state.saved) {
      setEditing(false);
      router.refresh();
    }
  }, [router, state.saved]);

  return <section className="report-highlight" aria-labelledby="report-highlight-title">
    <div className="report-highlight-heading"><div><p className="eyebrow">Destaque da semana</p><h2 id="report-highlight-title">{editing ? "Editar destaque" : value}</h2></div>{editable && !editing ? <button className="outline-button" data-tour="edit-highlight" onClick={() => setEditing(true)} type="button">Editar destaque</button> : null}</div>
    {editing ? <form action={formAction} className="report-highlight-form"><input name="reportId" type="hidden" value={reportId} /><textarea aria-label="Destaque da semana" defaultValue={highlight ?? ""} maxLength={180} name="highlight" required rows={3} /><div className="report-highlight-actions"><button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar destaque"}</button><button className="outline-button" disabled={pending} onClick={() => setEditing(false)} type="button">Cancelar</button></div>{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}</form> : null}
  </section>;
}

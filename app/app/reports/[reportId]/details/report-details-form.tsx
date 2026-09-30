"use client";

import { useActionState } from "react";
import { saveReportDetails, type ReportDetailsState } from "./actions";

type ReportDetails = {
  start_date: string;
  end_date: string;
  presentation_date: string | null;
  highlight: string | null;
};

const initialState: ReportDetailsState = {};

export function ReportDetailsForm({ reportId, report }: { reportId: string; report: ReportDetails }) {
  const [state, formAction, pending] = useActionState(saveReportDetails, initialState);

  return (
    <form action={formAction} className="auth-form">
      <input name="reportId" type="hidden" value={reportId} />
      <label>Data inicial<input defaultValue={report.start_date} name="startDate" required type="date" /></label>
      <label>Data final<input defaultValue={report.end_date} name="endDate" required type="date" /></label>
      <label>Data da apresentação<input defaultValue={report.presentation_date ?? ""} name="presentationDate" required type="date" /></label>
      <label>
        Destaque da semana
        <textarea defaultValue={report.highlight ?? ""} maxLength={180} name="highlight" required rows={4} />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar detalhes"}</button>
    </form>
  );
}

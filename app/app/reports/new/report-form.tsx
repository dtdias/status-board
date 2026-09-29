"use client";

import { useActionState } from "react";
import { createReport, type CreateReportState } from "./actions";

const initialState: CreateReportState = {};

export function ReportForm() {
  const [state, formAction, pending] = useActionState(createReport, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        Data inicial
        <input name="startDate" required type="date" />
      </label>
      <label>
        Data final
        <input name="endDate" required type="date" />
      </label>
      <label>
        Data da apresentação
        <input name="presentationDate" required type="date" />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Criando..." : "Criar semana"}
      </button>
    </form>
  );
}

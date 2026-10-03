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
      <label>
        Destaque da semana
        <textarea maxLength={180} name="highlight" required rows={4} />
      </label>
      <fieldset className="clone-options">
        <legend>Começar com</legend>
        <label><input defaultChecked name="cloneMode" type="radio" value="empty" /> Vazia</label>
        <label><input name="cloneMode" type="radio" value="in_progress" /> Itens em andamento</label>
        <label><input name="cloneMode" type="radio" value="support" /> Sustentação</label>
        <label><input name="cloneMode" type="radio" value="next_steps" /> Próximos passos</label>
        <label><input name="cloneMode" type="radio" value="all_previous" /> Tudo da semana anterior</label>
      </fieldset>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Criando..." : "Criar semana"}
      </button>
    </form>
  );
}

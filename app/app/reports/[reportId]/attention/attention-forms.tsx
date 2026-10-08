"use client";

import { useActionState } from "react";
import { saveDependency, saveNextStep, type AttentionState } from "./actions";

type Dependency = { id: string; title: string; description: string; owner: string; waiting_since: string; status: string | null; hide_owner_in_presentation: boolean; hide_waiting_since_in_presentation: boolean };
type NextStep = { id: string; title: string; description: string | null; owner: string | null; due_date: string | null; hide_owner_in_presentation: boolean; hide_due_date_in_presentation: boolean };
const initialState: AttentionState = {};

export function DependencyForm({ reportId, dependency }: { reportId: string; dependency?: Dependency }) {
  const [state, formAction, pending] = useActionState(saveDependency, initialState);
  return <form action={formAction} className="auth-form">
    <input name="reportId" type="hidden" value={reportId} />
    {dependency ? <input name="dependencyId" type="hidden" value={dependency.id} /> : null}
    <label>Título<input data-tour="form-dependency-title" defaultValue={dependency?.title} maxLength={60} name="title" required /></label>
    <label>Descrição<textarea data-tour="form-dependency-description" defaultValue={dependency?.description} maxLength={160} name="description" required rows={4} /></label>
    <label>Responsável<input data-tour="form-dependency-owner" defaultValue={dependency?.owner} maxLength={80} name="owner" required /></label>
    <label>Aguardando desde<input data-tour="form-dependency-date" defaultValue={dependency?.waiting_since} name="waitingSince" required type="date" /></label>
    <label>Status<input data-tour="form-dependency-status" defaultValue={dependency?.status ?? ""} maxLength={100} name="status" /></label>
    <fieldset className="form-options" data-tour="form-dependency-display"><legend>Exibição no PowerPoint</legend><label><input defaultChecked={dependency?.hide_owner_in_presentation ?? false} name="hideOwnerInPresentation" type="checkbox" /> Ocultar responsável no slide</label><label><input defaultChecked={dependency?.hide_waiting_since_in_presentation ?? false} name="hideWaitingSinceInPresentation" type="checkbox" /> Ocultar “Desde” no slide</label></fieldset>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <button className="primary-button" data-tour="form-dependency-submit" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar dependência"}</button>
  </form>;
}

export function NextStepForm({ reportId, nextStep }: { reportId: string; nextStep?: NextStep }) {
  const [state, formAction, pending] = useActionState(saveNextStep, initialState);
  return <form action={formAction} className="auth-form">
    <input name="reportId" type="hidden" value={reportId} />
    {nextStep ? <input name="nextStepId" type="hidden" value={nextStep.id} /> : null}
    <label>Título<input data-tour="form-next-title" defaultValue={nextStep?.title} maxLength={60} name="title" required /></label>
    <label>Descrição<textarea data-tour="form-next-description" defaultValue={nextStep?.description ?? ""} maxLength={160} name="description" rows={4} /></label>
    <label>Responsável<input data-tour="form-next-owner" defaultValue={nextStep?.owner ?? ""} maxLength={80} name="owner" /></label>
    <label>Prazo<input data-tour="form-next-date" defaultValue={nextStep?.due_date ?? ""} name="dueDate" type="date" /></label>
    <fieldset className="form-options" data-tour="form-next-display"><legend>Exibição no PowerPoint</legend><label><input defaultChecked={nextStep?.hide_owner_in_presentation ?? false} name="hideOwnerInPresentation" type="checkbox" /> Ocultar responsável no slide</label><label><input defaultChecked={nextStep?.hide_due_date_in_presentation ?? false} name="hideDueDateInPresentation" type="checkbox" /> Ocultar prazo no slide</label></fieldset>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <button className="primary-button" data-tour="form-next-submit" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar próximo passo"}</button>
  </form>;
}

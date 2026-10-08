"use client";

import { useActionState } from "react";
import { saveSupportRoutine, type SupportState } from "./actions";

type Routine = { id: string; title: string };
const initialState: SupportState = {};

export function RoutineForm({ reportId, frontId, routine }: { reportId: string; frontId: string; routine?: Routine }) {
  const [state, formAction, pending] = useActionState(saveSupportRoutine, initialState);
  return <form action={formAction} className="routine-form">
    <input name="reportId" type="hidden" value={reportId} />
    <input name="frontId" type="hidden" value={frontId} />
    {routine ? <input name="routineId" type="hidden" value={routine.id} /> : null}
    <label>{routine ? "Editar rotina" : "Nova rotina"}<input data-tour={!routine ? "form-routine-title" : undefined} defaultValue={routine?.title} maxLength={90} name="title" required /></label>
    {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    <button className="outline-button" data-tour={!routine ? "form-routine-submit" : undefined} disabled={pending} type="submit">{pending ? "Salvando..." : routine ? "Atualizar" : "Adicionar rotina"}</button>
  </form>;
}

"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

const initialState: ProfileState = {};

export function ProfileForm() {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        Nome
        <input autoComplete="name" name="name" required />
      </label>
      <label>
        Área
        <input name="area" placeholder="Ex.: Tecnologia" required />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Continuar"}
      </button>
    </form>
  );
}

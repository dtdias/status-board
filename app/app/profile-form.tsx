"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";

const initialState: ProfileState = {};

type ProfileFormProps = {
  profile?: { name: string; area: string };
  submitLabel?: string;
};

export function ProfileForm({ profile, submitLabel = "Continuar" }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        Nome
        <input autoComplete="name" defaultValue={profile?.name} maxLength={80} name="name" required />
      </label>
      <label>
        Área
        <input defaultValue={profile?.area} maxLength={80} name="area" placeholder="Ex.: Tecnologia" required />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}

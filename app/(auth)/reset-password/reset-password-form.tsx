"use client";

import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        Nova senha
        <input autoComplete="new-password" minLength={8} name="password" required type="password" />
      </label>
      <label>
        Confirme a nova senha
        <input autoComplete="new-password" minLength={8} name="passwordConfirmation" required type="password" />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Atualizar senha"}
      </button>
    </form>
  );
}

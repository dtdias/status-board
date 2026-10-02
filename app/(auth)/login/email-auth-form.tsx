"use client";

import { useActionState } from "react";
import { requestMagicLink, requestPasswordReset, type EmailActionState } from "./actions";

const initialState: EmailActionState = {};

type EmailAuthFormProps = {
  kind: "magic" | "reset";
};

export function EmailAuthForm({ kind }: EmailAuthFormProps) {
  const action = kind === "magic" ? requestMagicLink : requestPasswordReset;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isMagic = kind === "magic";

  return (
    <form action={formAction} className="auth-form email-auth-form">
      <label>
        E-mail
        <input autoComplete="email" defaultValue={state.email} name="email" required type="email" />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
      <button className="muted-button" disabled={pending} type="submit">
        {pending ? "Enviando..." : isMagic ? "Enviar Magic Link" : "Enviar instruções"}
      </button>
    </form>
  );
}

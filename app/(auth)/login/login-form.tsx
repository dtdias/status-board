"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label>
        E-mail
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        Senha
        <input autoComplete="current-password" minLength={6} name="password" required type="password" />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

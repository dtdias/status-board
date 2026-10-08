"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";
import { signUp, type SignUpState } from "./actions";
import { ResendConfirmationForm } from "./resend-confirmation-form";

const initialState: SignUpState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <>
      <form action={formAction} className="auth-form">
        <label>
          E-mail
          <input autoComplete="email" name="email" required type="email" />
        </label>
        <label>
          Senha
          <input autoComplete="new-password" minLength={8} name="password" required type="password" />
        </label>
        <label>
          Confirme a senha
          <input autoComplete="new-password" minLength={8} name="passwordConfirmation" required type="password" />
        </label>
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Criando..." : "Criar conta"}
        </button>
      </form>
      {state.email ? <ResendConfirmationForm email={state.email} initialCooldownUntil={state.cooldownUntil} /> : null}
      <p className="auth-secondary-link"><Link href={"/login" as Route}>Já tenho uma conta</Link></p>
    </>
  );
}

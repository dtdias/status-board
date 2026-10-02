"use client";

import { useActionState } from "react";
import { signOutAccount, type SignOutState } from "@/app/app/actions";

const initialState: SignOutState = {};

export function SignOutButton() {
  const [state, action, pending] = useActionState(signOutAccount, initialState);

  return (
    <form action={action} className="account-sign-out">
      <input name="intent" type="hidden" value="sign-out" />
      <button className="outline-button" disabled={pending} type="submit">
        {pending ? "Saindo…" : "Sair"}
      </button>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
    </form>
  );
}

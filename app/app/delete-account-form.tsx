"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteAccountState } from "./actions";

const initialState: DeleteAccountState = {};

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <form action={formAction} className="danger-zone">
      <div>
        <p className="eyebrow">Zona de risco</p>
        <h2>Excluir conta</h2>
        <p className="form-hint">A exclusão remove perfil, relatórios e apresentações geradas. Essa ação não pode ser desfeita.</p>
      </div>
      <label>
        Senha atual
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      <label>
        Digite EXCLUIR CONTA
        <input autoComplete="off" name="confirmation" required />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="danger-button" disabled={pending} type="submit">
        {pending ? "Excluindo..." : "Excluir minha conta"}
      </button>
    </form>
  );
}

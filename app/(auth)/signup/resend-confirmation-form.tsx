"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { resendConfirmation, type ResendState } from "./actions";

const initialState: ResendState = {};

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function ResendConfirmationForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(resendConfirmation, initialState);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!state.cooldownUntil) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((state.cooldownUntil! - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [state.cooldownUntil]);

  return (
    <form action={formAction} className="resend-form">
      <input name="email" type="hidden" value={email} />
      <p className="form-hint">Não recebeu o e-mail? Novo envio disponível após cinco minutos.</p>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
      <button className="muted-button" disabled={pending || remaining > 0 || state.accountConfirmed} type="submit">
        {pending ? "Enviando..." : remaining > 0 ? `Reenviar em ${formatCooldown(remaining)}` : "Reenviar confirmação"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

type UploadState = { error?: string; success?: string };

export function TemplateUploadForm() {
  const [state, setState] = useState<UploadState>({});
  const [isPending, setIsPending] = useState(false);

  async function submit(formData: FormData) {
    setIsPending(true);
    setState({});
    try {
      const response = await fetch("/api/admin/templates", { method: "POST", body: formData });
      const result = await response.json() as { error?: string; path?: string };
      if (!response.ok) {
        setState({ error: result.error ?? "Não foi possível enviar o template." });
        return;
      }
      setState({ success: `Template enviado para ${result.path}.` });
    } catch {
      setState({ error: "Não foi possível enviar o template." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={submit} className="auth-form" encType="multipart/form-data">
      <label htmlFor="version">
        Versão
        <input defaultValue="v1" id="version" name="version" pattern="v[1-9][0-9]*(\.[0-9]+)*" required />
      </label>
      <label htmlFor="file">
        Arquivo PPTX
        <input accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" id="file" name="file" required type="file" />
      </label>
      <p className="form-hint">Use versão nova e arquivo de até 25 MB. Arquivos publicados não podem ser substituídos.</p>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
      <button className="primary-button" disabled={isPending} type="submit">{isPending ? "Enviando..." : "Enviar template"}</button>
    </form>
  );
}

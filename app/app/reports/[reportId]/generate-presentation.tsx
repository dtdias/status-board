"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRESENTATION_THEMES, type PresentationThemeId } from "@/lib/pptx/themes";

type Presentation = {
  id: string;
  downloadUrl: string;
  fileName: string;
  version: number;
};

type GeneratePresentationProps = {
  reportId: string;
  availableThemes?: PresentationThemeId[];
  defaultTheme?: PresentationThemeId;
};

export function GeneratePresentation({ reportId, availableThemes = ["base"], defaultTheme = "base" }: GeneratePresentationProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PresentationThemeId>(availableThemes.includes(defaultTheme) ? defaultTheme : "base");

  function openPicker() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closePicker() {
    if (isGenerating) return;
    dialogRef.current?.close();
  }

  async function generate() {
    setError(null);
    setPresentation(null);
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/generate-pptx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme }),
      });
      const body = await response.json() as { error?: string; message?: string; presentation?: Presentation; valid?: boolean };
      if (!response.ok) {
        setError(body.message ?? body.error ?? (body.valid === false ? "Review the report details before generating the presentation." : "Unable to generate the presentation."));
        dialogRef.current?.close();
        return;
      }
      if (!body.presentation) {
        setError("Unable to generate the presentation.");
        dialogRef.current?.close();
        return;
      }
      setPresentation(body.presentation);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Network error while generating the presentation. Check your connection and try again.");
      dialogRef.current?.close();
    } finally {
      setIsGenerating(false);
    }
  }

  const themes = PRESENTATION_THEMES.filter((theme) => availableThemes.includes(theme.id));

  return <div className="generate-presentation">
    <button className="primary-button" data-tour="generate-pptx" type="button" onClick={openPicker} disabled={isGenerating}>{isGenerating ? "Gerando..." : "Gerar PowerPoint"}</button>
    <dialog aria-describedby="theme-picker-hint" aria-labelledby="theme-picker-title" className="theme-picker" onCancel={(event) => { if (isGenerating) event.preventDefault(); }} ref={dialogRef}>
      <form className="theme-picker-form" method="dialog" onSubmit={(event) => { event.preventDefault(); void generate(); }}>
        <header className="theme-picker-header">
          <p className="eyebrow">Gerar PowerPoint</p>
          <h2 id="theme-picker-title">Escolha o tema</h2>
          <p className="form-hint" id="theme-picker-hint">O conteúdo é o mesmo em todos os temas; muda só o visual. Sua escolha fica salva para esta semana.</p>
        </header>
        <fieldset className="theme-picker-grid" disabled={isGenerating}>
          <legend className="visually-hidden">Temas disponíveis</legend>
          {themes.map((theme) => <label className="theme-card" data-selected={selectedTheme === theme.id} key={theme.id}>
            <input checked={selectedTheme === theme.id} name="theme" onChange={() => setSelectedTheme(theme.id)} type="radio" value={theme.id} />
            <img alt="" className="theme-card-thumb" height={180} loading="lazy" src={theme.thumbnail} width={648} />
            <span className="theme-card-body">
              <strong>{theme.name}</strong>
              <span className="theme-card-meta">
                <span aria-hidden="true" className="theme-swatch" style={{ background: theme.surface }} />
                <span aria-hidden="true" className="theme-swatch" style={{ background: theme.accent }} />
                {theme.font}
              </span>
              <span className="form-hint">{theme.description}</span>
              <a className="theme-card-preview" href={`/app/reports/${reportId}/preview?theme=${theme.id}`} onClick={(event) => event.stopPropagation()} rel="noopener" target="_blank">Visualizar com este tema</a>
            </span>
          </label>)}
        </fieldset>
        <footer className="theme-picker-actions">
          <button className="muted-button" disabled={isGenerating} onClick={closePicker} type="button">Cancelar</button>
          <button className="primary-button" disabled={isGenerating} type="submit">{isGenerating ? "Gerando..." : "Gerar com este tema"}</button>
        </footer>
      </form>
    </dialog>
    <div aria-live="polite">
      {error ? <p className="form-error">{error}</p> : null}
      {presentation ? <div className="generated-presentation-actions"><a className="form-success" href={`/app/reports/${reportId}/presentations/${presentation.id}/preview`}>Visualizar PowerPoint</a><a className="form-success" href={presentation.downloadUrl} download={presentation.fileName}>PowerPoint pronto. Baixar arquivo.</a></div> : null}
    </div>
  </div>;
}

"use client";

import { useState } from "react";

type Presentation = {
  downloadUrl: string;
  fileName: string;
};

export function GeneratePresentation({ reportId }: { reportId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generate() {
    setError(null);
    setPresentation(null);
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/generate-pptx`, { method: "POST" });
      const body = await response.json() as { error?: string; message?: string; presentation?: Presentation; valid?: boolean };
      if (!response.ok) {
        setError(body.message ?? body.error ?? (body.valid === false ? "Review the report details before generating the presentation." : "Unable to generate the presentation."));
        return;
      }
      if (!body.presentation) {
        setError("Unable to generate the presentation.");
        return;
      }
      setPresentation(body.presentation);
    } catch {
      setError("Network error while generating the presentation. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return <div className="generate-presentation">
    <button className="primary-button" type="button" onClick={generate} disabled={isGenerating}>{isGenerating ? "Gerando..." : "Gerar PowerPoint"}</button>
    <div aria-live="polite">
      {error ? <p className="form-error">{error}</p> : null}
      {presentation ? <a className="form-success" href={presentation.downloadUrl} download={presentation.fileName}>PowerPoint pronto. Baixar arquivo.</a> : null}
    </div>
  </div>;
}

import type { GeneratedPresentation } from "@/lib/storage/generated-presentation";

export function formatPresentationGeneratedAt(generatedAt: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(generatedAt));
}

export function PresentationHistory({
  presentations,
  reportId,
}: {
  presentations: GeneratedPresentation[];
  reportId: string;
}) {
  return (
    <section className="presentation-history" aria-labelledby="presentation-history-title">
      <div>
        <p className="eyebrow">PowerPoints gerados</p>
        <h2 id="presentation-history-title">Histórico de apresentações</h2>
      </div>
      {presentations.length ? (
        <ol className="presentation-list">
          {presentations.map((presentation) => (
            <li key={presentation.id}>
              <div>
                <span className="presentation-version">Versão {presentation.version}</span>
                <strong>{presentation.fileName}</strong>
                <time dateTime={presentation.generatedAt}>Gerado em {formatPresentationGeneratedAt(presentation.generatedAt)}</time>
              </div>
              <a
                className="outline-button"
                href={`/api/reports/${reportId}/presentations/${presentation.id}/download`}
                download={presentation.fileName}
              >
                Baixar PowerPoint
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="presentation-history-empty">Nenhuma apresentação foi gerada para este relatório.</p>
      )}
    </section>
  );
}

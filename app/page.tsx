const columns = [
  { label: "Entregas", count: 0, tone: "green" },
  { label: "Incidentes", count: 0, tone: "red" },
  { label: "Demandas", count: 0, tone: "yellow" },
  { label: "Sustentação", count: 0, tone: "blue" },
  { label: "Atenção", count: 0, tone: "orange" },
] as const;

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Status Board / 01</p>
          <h1>Status semanal</h1>
        </div>
        <button className="outline-button" type="button">Nova semana</button>
      </header>

      <section className="intro" aria-labelledby="board-title">
        <div>
          <p className="eyebrow">Rascunho atual</p>
          <h2 id="board-title">Organize a semana. Gere os slides.</h2>
          <p className="intro-copy">Um único board para registrar progresso, bloqueios e próximos passos.</p>
        </div>
        <div className="date-card">
          <span>Período</span>
          <strong>Selecione uma semana</strong>
        </div>
      </section>

      <section className="board" aria-label="Colunas do status semanal">
        {columns.map((column) => (
          <article className="board-column" key={column.label}>
            <div className="column-heading">
              <span className={`status-dot ${column.tone}`} aria-hidden="true" />
              <h3>{column.label}</h3>
              <span className="count">{column.count}</span>
            </div>
            <div className="empty-state">
              <span className="empty-mark" aria-hidden="true">+</span>
              <p>Nenhum item ainda</p>
              <button type="button">Adicionar</button>
            </div>
          </article>
        ))}
      </section>

      <footer className="actionbar">
        <p>Comece criando uma semana para ativar o board.</p>
        <div className="actions">
          <button className="muted-button" type="button" disabled>Validar</button>
          <button className="muted-button" type="button" disabled>Pré-visualizar</button>
          <button className="primary-button" type="button" disabled>Gerar PowerPoint</button>
        </div>
      </footer>
    </main>
  );
}

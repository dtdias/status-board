import Link from "next/link";
import type { Route } from "next";
import { ReportForm } from "./report-form";

export default function NewReportPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href={"/app" as Route}>Status Board</Link>
        <p className="eyebrow">Nova semana</p>
        <h1>Comece pelo período.</h1>
        <p className="intro-copy">Escolha o período e, se necessário, traga o que continua da semana anterior.</p>
        <ReportForm />
      </section>
    </main>
  );
}

import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { ReportForm } from "./report-form";

export default function NewReportPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BackLink href={"/app" as Route} label="Voltar às semanas" />
        <p className="eyebrow">Nova semana</p>
        <h1>Comece pelo período.</h1>
        <p className="intro-copy">Escolha o período e, se necessário, traga o que continua da semana anterior.</p>
        <ReportForm />
      </section>
    </main>
  );
}

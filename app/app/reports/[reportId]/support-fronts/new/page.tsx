import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { SupportFrontForm } from "../support-front-form";

export default async function NewSupportFrontPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Sustentação</p><h1>Nova frente</h1><SupportFrontForm reportId={reportId} /></section></main>;
}

import Link from "next/link";
import type { Route } from "next";
import { SupportFrontForm } from "../support-front-form";

export default async function NewSupportFrontPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><Link className="brand" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link><p className="eyebrow">Sustentação</p><h1>Nova frente</h1><SupportFrontForm reportId={reportId} /></section></main>;
}

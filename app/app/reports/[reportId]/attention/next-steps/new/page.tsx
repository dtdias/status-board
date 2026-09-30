import Link from "next/link";
import type { Route } from "next";
import { NextStepForm } from "../../attention-forms";

export default async function NewNextStepPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><Link className="brand" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link><p className="eyebrow">Novo próximo passo</p><h1>O que vem agora?</h1><NextStepForm reportId={reportId} /></section></main>;
}

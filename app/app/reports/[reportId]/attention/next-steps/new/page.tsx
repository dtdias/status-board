import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { NextStepForm } from "../../attention-forms";

export default async function NewNextStepPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Novo próximo passo</p><h1>O que vem agora?</h1><NextStepForm reportId={reportId} /></section></main>;
}

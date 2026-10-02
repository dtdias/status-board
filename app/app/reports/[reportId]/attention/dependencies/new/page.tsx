import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { DependencyForm } from "../../attention-forms";

export default async function NewDependencyPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Nova dependência</p><h1>O que precisa destravar?</h1><DependencyForm reportId={reportId} /></section></main>;
}

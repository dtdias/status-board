import Link from "next/link";
import type { Route } from "next";
import { DependencyForm } from "../../attention-forms";

export default async function NewDependencyPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><Link className="brand" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link><p className="eyebrow">Nova dependência</p><h1>O que precisa destravar?</h1><DependencyForm reportId={reportId} /></section></main>;
}

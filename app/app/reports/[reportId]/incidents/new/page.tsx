import Link from "next/link";
import type { Route } from "next";
import { IncidentForm } from "../incident-form";
export default async function NewIncidentPage({ params }: { params: Promise<{ reportId: string }> }) { const { reportId } = await params; return <main className="auth-shell"><section className="auth-panel"><Link className="brand" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link><p className="eyebrow">Novo incidente</p><h1>O que ocorreu?</h1><IncidentForm reportId={reportId} /></section></main>; }

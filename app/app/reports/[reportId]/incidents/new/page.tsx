import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { IncidentForm } from "../incident-form";
export default async function NewIncidentPage({ params }: { params: Promise<{ reportId: string }> }) { const { reportId } = await params; return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Novo incidente</p><h1>O que ocorreu?</h1><IncidentForm reportId={reportId} /></section></main>; }

import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { DemandForm } from "../demand-form";
export default async function NewDemandPage({ params }: { params: Promise<{ reportId: string }> }) { const { reportId } = await params; return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><DemandForm reportId={reportId} /></section></main>; }

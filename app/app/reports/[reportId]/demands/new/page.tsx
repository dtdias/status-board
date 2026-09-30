import { DemandForm } from "../demand-form";
export default async function NewDemandPage({ params }: { params: Promise<{ reportId: string }> }) { const { reportId } = await params; return <main className="auth-shell"><section className="auth-panel"><DemandForm reportId={reportId} /></section></main>; }

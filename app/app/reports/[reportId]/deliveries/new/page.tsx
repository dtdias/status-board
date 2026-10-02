import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { DeliveryForm } from "../delivery-form";

export default async function NewDeliveryPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Nova entrega</p><h1>O que foi entregue?</h1><DeliveryForm reportId={reportId} /></section></main>;
}

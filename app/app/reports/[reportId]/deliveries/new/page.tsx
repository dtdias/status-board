import Link from "next/link";
import type { Route } from "next";
import { DeliveryForm } from "../delivery-form";

export default async function NewDeliveryPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <main className="auth-shell"><section className="auth-panel"><Link className="brand" href={`/app/reports/${reportId}` as Route}>Voltar ao board</Link><p className="eyebrow">Nova entrega</p><h1>O que foi entregue?</h1><DeliveryForm reportId={reportId} /></section></main>;
}

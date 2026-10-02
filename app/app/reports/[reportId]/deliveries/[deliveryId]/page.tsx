import { notFound } from "next/navigation";
import type { Route } from "next";
import { BackLink } from "@/components/navigation/back-link";
import { createClient } from "@/lib/supabase/server";
import { deleteDelivery } from "../actions";
import { DeliveryForm } from "../delivery-form";

export default async function DeliveryPage({ params }: { params: Promise<{ reportId: string; deliveryId: string }> }) {
  const { reportId, deliveryId } = await params;
  const supabase = await createClient();
  const { data: delivery } = await supabase.from("deliveries").select("id, title, description, status, icon_key").eq("id", deliveryId).eq("weekly_report_id", reportId).maybeSingle();
  if (!delivery) notFound();
  return <main className="auth-shell"><section className="auth-panel"><BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" /><p className="eyebrow">Editar entrega</p><h1>{delivery.title}</h1><DeliveryForm delivery={delivery} reportId={reportId} /><form action={deleteDelivery} className="delete-form"><input name="reportId" type="hidden" value={reportId} /><input name="deliveryId" type="hidden" value={deliveryId} /><button type="submit">Excluir entrega</button></form></section></main>;
}

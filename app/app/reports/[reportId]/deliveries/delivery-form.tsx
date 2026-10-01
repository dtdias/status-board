"use client";

import { useActionState } from "react";
import { ReportIconPicker } from "@/components/report-icon-picker";
import { deliveryIcons, deliveryStatusMeta, deliveryStatuses } from "@/lib/deliveries/delivery";
import { saveDelivery, type DeliveryState } from "./actions";

type Delivery = {
  id: string;
  title: string;
  description: string;
  status: keyof typeof deliveryStatusMeta;
  icon_key: string;
};

const initialState: DeliveryState = {};

export function DeliveryForm({ reportId, delivery }: { reportId: string; delivery?: Delivery }) {
  const [state, formAction, pending] = useActionState(saveDelivery, initialState);

  return (
    <form action={formAction} className="auth-form">
      <input name="reportId" type="hidden" value={reportId} />
      {delivery ? <input name="deliveryId" type="hidden" value={delivery.id} /> : null}
      <label>Nome da entrega<input defaultValue={delivery?.title} maxLength={60} name="title" required /></label>
      <label>Descrição<textarea defaultValue={delivery?.description} maxLength={150} name="description" required rows={4} /></label>
      <label>
        Status
        <select defaultValue={delivery?.status ?? "delivered"} name="status">
          {deliveryStatuses.map((status) => <option key={status} value={status}>{deliveryStatusMeta[status].label}</option>)}
        </select>
      </label>
      <ReportIconPicker defaultValue={delivery?.icon_key ?? "integration"} label="Ícone" name="iconKey" options={deliveryIcons} />
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button" disabled={pending} type="submit">{pending ? "Salvando..." : "Salvar entrega"}</button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderById } from "@/lib/board/reorder";
import { deliveryStatusMeta } from "@/lib/deliveries/delivery";
import { reorderDeliveries } from "./delivery-order-actions";

type Delivery = {
  id: string;
  title: string;
  description: string;
  icon_key: string;
  position: number;
  status: keyof typeof deliveryStatusMeta;
};

function SortableDeliveryCard({ delivery, href, disabled }: { delivery: Delivery; href: Route; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: delivery.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div className={`delivery-card sortable-delivery-card${isDragging ? " is-dragging" : ""}`} ref={setNodeRef} style={style}>
      <button aria-label={`Reordenar ${delivery.title}`} className="drag-handle" disabled={disabled} type="button" {...attributes} {...listeners}>Reordenar</button>
      <Link className="delivery-card-content" href={href}>
        <span className="delivery-icon">{delivery.icon_key.slice(0, 1).toUpperCase()}</span>
        <strong>{delivery.title}</strong>
        <p>{delivery.description}</p>
        <span className="delivery-status" style={{ background: deliveryStatusMeta[delivery.status].color }}>{deliveryStatusMeta[delivery.status].label}</span>
      </Link>
    </div>
  );
}

export function DeliverySortableList({ deliveries: initialDeliveries, reportId }: { deliveries: Delivery[]; reportId: string }) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (saving || !over || active.id === over.id) return;

    const previous = deliveries;
    const next = reorderById(deliveries, String(active.id), String(over.id));
    setDeliveries(next);
    setError(undefined);
    setSaving(true);

    const result = await reorderDeliveries({ reportId, orderedIds: next.map((delivery) => delivery.id) });
    if (result.error) {
      setDeliveries(previous);
      setError(result.error);
    }
    setSaving(false);
  }

  return (
    <>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={deliveries.map((delivery) => delivery.id)} strategy={verticalListSortingStrategy}>
          <div className="delivery-stack">
            {deliveries.map((delivery) => <SortableDeliveryCard delivery={delivery} disabled={saving} href={`/app/reports/${reportId}/deliveries/${delivery.id}` as Route} key={delivery.id} />)}
          </div>
        </SortableContext>
      </DndContext>
      {error ? <p className="form-error reorder-error" role="alert">{error}</p> : null}
    </>
  );
}

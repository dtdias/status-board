"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReportIcon } from "@/components/report-icon";
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

function SortableDeliveryCard({
  delivery,
  href,
  disabled,
  index,
  total,
  onMove,
}: {
  delivery: Delivery;
  href: Route;
  disabled: boolean;
  index: number;
  total: number;
  onMove: (deliveryId: string, direction: "up" | "down") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: delivery.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div className={`delivery-card sortable-delivery-card${isDragging ? " is-dragging" : ""}`} ref={setNodeRef} style={style}>
      <button aria-label={`Reordenar ${delivery.title}`} className="drag-handle" disabled={disabled} type="button" {...attributes} {...listeners}>Reordenar</button>
      <Link className="delivery-card-content" href={href}>
        <ReportIcon className="delivery-icon" iconKey={delivery.icon_key} />
        <strong>{delivery.title}</strong>
        <p>{delivery.description}</p>
        <span className="delivery-status" style={{ background: deliveryStatusMeta[delivery.status].color }}>{deliveryStatusMeta[delivery.status].label}</span>
      </Link>
      <div className="reorder-controls" aria-label={`Controles de ordem de ${delivery.title}`} role="group">
        <button
          aria-label={`Mover ${delivery.title} para cima`}
          className="reorder-button"
          disabled={disabled || index === 0}
          onClick={() => onMove(delivery.id, "up")}
          type="button"
        >
          Cima
        </button>
        <button
          aria-label={`Mover ${delivery.title} para baixo`}
          className="reorder-button"
          disabled={disabled || index === total - 1}
          onClick={() => onMove(delivery.id, "down")}
          type="button"
        >
          Baixo
        </button>
      </div>
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

  async function persistOrder(previous: Delivery[], next: Delivery[]) {
    setDeliveries(next);
    setError(undefined);
    setSaving(true);

    try {
      const result = await reorderDeliveries({ reportId, orderedIds: next.map((delivery) => delivery.id) });
      if (!result.error) return;
      setDeliveries(previous);
      setError(result.error);
    } catch {
      setDeliveries(previous);
      setError("Não foi possível salvar a nova ordem.");
    } finally {
      setSaving(false);
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (saving || !over || active.id === over.id) return;

    const previous = deliveries;
    const next = reorderById(deliveries, String(active.id), String(over.id));
    void persistOrder(previous, next);
  }

  function handleMove(deliveryId: string, direction: "up" | "down") {
    if (saving) return;

    const index = deliveries.findIndex((delivery) => delivery.id === deliveryId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= deliveries.length) return;

    const previous = deliveries;
    const next = reorderById(deliveries, deliveryId, deliveries[targetIndex].id);
    void persistOrder(previous, next);
  }

  return (
    <>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={deliveries.map((delivery) => delivery.id)} strategy={verticalListSortingStrategy}>
          <div className="delivery-stack">
            {deliveries.map((delivery, index) => (
              <SortableDeliveryCard
                delivery={delivery}
                disabled={saving}
                href={`/app/reports/${reportId}/deliveries/${delivery.id}` as Route}
                index={index}
                key={delivery.id}
                onMove={handleMove}
                total={deliveries.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {error ? <p className="form-error reorder-error" role="alert">{error}</p> : null}
    </>
  );
}

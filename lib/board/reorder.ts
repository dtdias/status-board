import { z } from "zod";

export type PositionedItem = { id: string; position: number };

export const orderedIdsSchema = z.array(z.uuid()).min(1).max(100).refine(
  (ids) => new Set(ids).size === ids.length,
  "Cada item deve aparecer uma única vez.",
);

export function reorderById<T extends PositionedItem>(items: readonly T[], activeId: string, overId: string): T[] {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return [...items];

  const reordered = [...items];
  const [moved] = reordered.splice(activeIndex, 1);
  reordered.splice(overIndex, 0, moved);

  return reordered.map((item, position) => ({ ...item, position }));
}

import { describe, expect, it } from "vitest";
import { orderedIdsSchema, reorderById } from "@/lib/board/reorder";

const first = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
const third = "33333333-3333-4333-8333-333333333333";
const items = [
  { id: first, position: 0, title: "Primeira" },
  { id: second, position: 1, title: "Segunda" },
  { id: third, position: 2, title: "Terceira" },
];

describe("reorderById", () => {
  it("moves an item and rewrites contiguous positions", () => {
    expect(reorderById(items, third, first)).toEqual([
      { id: third, position: 0, title: "Terceira" },
      { id: first, position: 1, title: "Primeira" },
      { id: second, position: 2, title: "Segunda" },
    ]);
  });

  it("leaves input unchanged for unknown ids", () => {
    expect(reorderById(items, "missing", first)).toEqual(items);
    expect(items.map((item) => item.position)).toEqual([0, 1, 2]);
  });
});

describe("orderedIdsSchema", () => {
  it("accepts a non-empty unique UUID list", () => {
    expect(orderedIdsSchema.safeParse([first, second]).success).toBe(true);
  });

  it("rejects duplicates and unsafe identifiers", () => {
    expect(orderedIdsSchema.safeParse([first, first]).success).toBe(false);
    expect(orderedIdsSchema.safeParse(["not-a-uuid"]).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { MAX_ROUTINES_PER_FRONT, supportFrontSchema, supportFrontWithRoutinesSchema, supportRoutineSchema } from "@/lib/support/support";

const validFront = { title: "Operação ERP", activityType: "Monitoramento", iconKey: "routine" };

describe("support schemas", () => {
  it("accepts a valid support front and routine", () => {
    expect(supportFrontSchema.parse(validFront)).toEqual(validFront);
    expect(supportRoutineSchema.parse({ title: "Acompanhar filas" })).toEqual({ title: "Acompanhar filas" });
  });

  it("enforces PRD content limits", () => {
    expect(supportFrontSchema.safeParse({ ...validFront, title: "a".repeat(51) }).success).toBe(false);
    expect(supportRoutineSchema.safeParse({ title: "a".repeat(91) }).success).toBe(false);
  });

  it("rejects more than three routines in one front", () => {
    expect(supportFrontWithRoutinesSchema.safeParse({ ...validFront, routines: Array.from({ length: MAX_ROUTINES_PER_FRONT + 1 }, () => ({ title: "Monitorar" })) }).success).toBe(false);
  });
});

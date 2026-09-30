import { describe, expect, it } from "vitest";
import { attentionLimits, dependencySchema, nextStepSchema } from "@/lib/attention/attention";

describe("attention schemas", () => {
  it("accepts a dependency with its required owner and waiting date", () => {
    expect(dependencySchema.parse({ title: "Liberação API", description: "Aguardando credencial de produção.", owner: "Infra", waitingSince: "2026-09-23", status: "Aguardando" })).toMatchObject({ owner: "Infra", waitingSince: "2026-09-23" });
  });

  it("rejects dependencies without an owner or waiting date", () => {
    const dependency = { title: "Liberação API", description: "Aguardando credencial.", owner: "Infra", waitingSince: "2026-09-23", status: "" };
    expect(dependencySchema.safeParse({ ...dependency, owner: "" }).success).toBe(false);
    expect(dependencySchema.safeParse({ ...dependency, waitingSince: "" }).success).toBe(false);
  });

  it("accepts optional next-step details and applies PRD limits", () => {
    expect(nextStepSchema.parse({ title: "Validar acesso", description: "", owner: "", dueDate: "" })).toMatchObject({ title: "Validar acesso", description: null, owner: null, dueDate: null });
    expect(nextStepSchema.safeParse({ title: "a".repeat(attentionLimits.nextStepTitle + 1), description: "", owner: "", dueDate: "" }).success).toBe(false);
  });
});

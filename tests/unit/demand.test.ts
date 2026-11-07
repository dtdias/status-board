import { expect, it } from "vitest";
import { demandSchema, phaseTone } from "@/lib/demands/demand";
it("derives phase tones", () => { expect(phaseTone("request_received", "development")).toBe("done"); expect(phaseTone("development", "development")).toBe("current"); expect(phaseTone("validation", "development")).toBe("future"); });

const validDemand = { title: "Novo BI", requesterName: "Ana", requesterArea: "Vendas", involvedAreas: "TI, Engenharia", objective: "Indicadores.", statusText: "", currentPhase: "development" } as const;

it("requires involved areas", () => {
  expect(demandSchema.safeParse(validDemand).success).toBe(true);
  for (const involvedAreas of ["", "   "]) {
    const result = demandSchema.safeParse({ ...validDemand, involvedAreas });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Informe as áreas envolvidas.");
  }
});

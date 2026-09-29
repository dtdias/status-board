import { describe, expect, it } from "vitest";
import { CONTENT_LIMITS, validateReport, type ReportValidationInput } from "@/lib/validation/report";

const validInput: ReportValidationInput = {
  report: { startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Integração ERP publicada" },
  deliveries: [{ id: "delivery-1", title: "Integração ERP", description: "Publicada em produção.", status: "delivered" }],
  incidents: [{ id: "incident-1", affectedSystem: "ERP", symptom: "Login indisponível", cause: null, actionTaken: "Serviço reiniciado", status: "resolved", resolvedAt: "2026-09-22" }],
  demands: [{ id: "demand-1", title: "Novo BI", requesterName: "Comercial", requesterArea: "Vendas", involvedAreas: ["TI"], objective: "Disponibilizar indicadores comerciais.", statusText: "Em análise", currentPhase: "feasibility_requirements" }],
  supportFronts: [{ id: "support-1", title: "Operação ERP", activityType: "Monitoramento", routines: [{ id: "routine-1", title: "Acompanhar filas" }] }],
  dependencies: [{ id: "dependency-1", title: "Credencial API", description: "Aguardando liberação de produção.", owner: "Infra", waitingSince: "2026-09-23" }],
  nextSteps: [{ id: "step-1", title: "Validar acesso", description: "Confirmar acesso de produção." }],
};

describe("validateReport", () => {
  it("accepts complete report content", () => {
    expect(validateReport(validInput)).toEqual({ valid: true, errors: [], warnings: [] });
  });

  it("reports required report and dependency fields as generation-blocking errors", () => {
    const result = validateReport({ ...validInput, report: { ...validInput.report, startDate: null }, dependencies: [{ ...validInput.dependencies[0], owner: "", waitingSince: null }] });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ section: "report", field: "startDate", code: "required" }),
      expect.objectContaining({ section: "dependency", entityId: "dependency-1", field: "owner", code: "required" }),
      expect.objectContaining({ section: "dependency", entityId: "dependency-1", field: "waitingSince", code: "required" }),
    ]));
  });

  it("checks required content across sections and resolved incidents", () => {
    const result = validateReport({ ...validInput, deliveries: [{ ...validInput.deliveries[0], status: "" }], incidents: [{ ...validInput.incidents[0], resolvedAt: null }], demands: [{ ...validInput.demands[0], involvedAreas: [] }], supportFronts: [{ ...validInput.supportFronts[0], routines: Array.from({ length: 4 }, (_, index) => ({ id: `routine-${index}`, title: "Monitorar" })) }], nextSteps: [{ ...validInput.nextSteps[0], title: "" }] });
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ section: "delivery", field: "status" }),
      expect.objectContaining({ section: "incident", field: "resolvedAt" }),
      expect.objectContaining({ section: "demand", field: "involvedAreas" }),
      expect.objectContaining({ section: "support", field: "routines", code: "support_routine_limit_exceeded" }),
      expect.objectContaining({ section: "next_step", field: "title" }),
    ]));
  });

  it("returns warnings near limits and errors above documented limits", () => {
    const nearLimit = "a".repeat(Math.ceil(CONTENT_LIMITS.deliveryDescription * 0.8));
    const result = validateReport({ ...validInput, deliveries: [{ ...validInput.deliveries[0], description: nearLimit }], nextSteps: [{ ...validInput.nextSteps[0], description: "a".repeat(CONTENT_LIMITS.nextStepDescription + 1) }] });
    expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ section: "delivery", field: "description", code: "content_limit_near" })]));
    expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ section: "next_step", field: "description", code: "content_limit_exceeded" })]));
  });
});

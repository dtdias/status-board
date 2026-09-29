import { describe, expect, it } from "vitest";
import { incidentSchema, incidentStatusMeta } from "@/lib/incidents/incident";
const valid = { affectedSystem: "ERP", symptom: "Login indisponível", actionTaken: "Reiniciado serviço", status: "resolved", resolvedAt: "2026-09-29", iconKey: "incident" };
describe("incidentSchema", () => { it("accepts a resolved incident with a date", () => expect(incidentSchema.parse(valid)).toMatchObject(valid)); it("requires resolvedAt for resolved incidents", () => expect(incidentSchema.safeParse({ ...valid, resolvedAt: "" }).success).toBe(false)); it("allows no resolution date while in progress", () => expect(incidentSchema.safeParse({ ...valid, status: "in_progress", resolvedAt: "" }).success).toBe(true)); });
describe("incidentStatusMeta", () => { it("maps blocked to PRD color", () => expect(incidentStatusMeta.blocked.color).toBe("#D7191C")); });

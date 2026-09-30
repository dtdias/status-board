import { z } from "zod";
import { CONTENT_LIMITS } from "@/lib/validation/report";
export const demandPhases = ["request_received", "feasibility_requirements", "development", "validation"] as const;
export const demandPhaseLabels = ["Solicitação recebida", "Viabilidade e requisitos", "Desenvolvimento", "Homologação"] as const;
export const demandSchema = z.object({ title: z.string().trim().min(1).max(CONTENT_LIMITS.demandTitle), requesterName: z.string().trim().min(1), requesterArea: z.string().trim().min(1), involvedAreas: z.string().trim(), objective: z.string().trim().min(1).max(CONTENT_LIMITS.demandObjective), statusText: z.string().trim().max(CONTENT_LIMITS.demandStatus), currentPhase: z.enum(demandPhases) });
export function phaseTone(phase: typeof demandPhases[number], current: typeof demandPhases[number]) { const offset = demandPhases.indexOf(phase) - demandPhases.indexOf(current); return offset < 0 ? "done" : offset === 0 ? "current" : "future"; }

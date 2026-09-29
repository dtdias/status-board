import { z } from "zod";
export const demandPhases = ["request_received", "feasibility_requirements", "development", "validation"] as const;
export const demandPhaseLabels = ["Solicitação recebida", "Viabilidade e requisitos", "Desenvolvimento", "Homologação"] as const;
export const demandSchema = z.object({ title: z.string().trim().min(1).max(60), requesterName: z.string().trim().min(1), requesterArea: z.string().trim().min(1), involvedAreas: z.string().trim(), objective: z.string().trim().min(1).max(220), statusText: z.string().trim().max(100), currentPhase: z.enum(demandPhases) });
export function phaseTone(phase: typeof demandPhases[number], current: typeof demandPhases[number]) { const offset = demandPhases.indexOf(phase) - demandPhases.indexOf(current); return offset < 0 ? "done" : offset === 0 ? "current" : "future"; }

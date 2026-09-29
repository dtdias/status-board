import { z } from "zod";
import { CONTENT_LIMITS } from "@/lib/validation/report";

export const incidentStatuses = ["resolved", "in_progress", "waiting_third_party", "blocked"] as const;
export const incidentStatusMeta = { resolved: { label: "Resolvido", color: "#2E8B57" }, in_progress: { label: "Em andamento", color: "#2F5D8A" }, waiting_third_party: { label: "Aguardando terceiro", color: "#C77700" }, blocked: { label: "Bloqueado", color: "#D7191C" } } as const;
export const incidentIcons = ["incident", "bug", "failure", "critical", "disconnection", "fix"] as const;

export const incidentSchema = z.object({
  affectedSystem: z.string().trim().min(1, "Informe o sistema afetado.").max(CONTENT_LIMITS.incidentSystem),
  symptom: z.string().trim().min(1, "Informe o que aconteceu.").max(CONTENT_LIMITS.incidentSymptom),
  cause: z.string().trim().max(CONTENT_LIMITS.incidentCause).optional(),
  actionTaken: z.string().trim().min(1, "Informe a ação tomada.").max(CONTENT_LIMITS.incidentAction),
  supportPeople: z.string().trim().optional(),
  status: z.enum(incidentStatuses),
  resolvedAt: z.union([z.iso.date(), z.literal("")]),
  iconKey: z.enum(incidentIcons),
}).superRefine((value, context) => {
  if (value.status === "resolved" && !value.resolvedAt) context.addIssue({ code: "custom", message: "Informe a data de resolução.", path: ["resolvedAt"] });
});

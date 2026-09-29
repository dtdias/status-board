import { z } from "zod";

export const incidentStatuses = ["resolved", "in_progress", "waiting_third_party", "blocked"] as const;
export const incidentStatusMeta = { resolved: { label: "Resolvido", color: "#2E8B57" }, in_progress: { label: "Em andamento", color: "#2F5D8A" }, waiting_third_party: { label: "Aguardando terceiro", color: "#C77700" }, blocked: { label: "Bloqueado", color: "#D7191C" } } as const;
export const incidentIcons = ["incident", "bug", "failure", "critical", "disconnection", "fix"] as const;

export const incidentSchema = z.object({
  affectedSystem: z.string().trim().min(1, "Informe o sistema afetado.").max(60),
  symptom: z.string().trim().min(1, "Informe o que aconteceu.").max(180),
  cause: z.string().trim().max(150).optional(),
  actionTaken: z.string().trim().min(1, "Informe a ação tomada.").max(180),
  supportPeople: z.string().trim().optional(),
  status: z.enum(incidentStatuses),
  resolvedAt: z.union([z.iso.date(), z.literal("")]),
  iconKey: z.enum(incidentIcons),
}).superRefine((value, context) => {
  if (value.status === "resolved" && !value.resolvedAt) context.addIssue({ code: "custom", message: "Informe a data de resolução.", path: ["resolvedAt"] });
});

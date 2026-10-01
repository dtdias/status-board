import { z } from "zod";
import { reportIconKeys, type ReportIconKey } from "@/lib/icons/report-icons";
import { CONTENT_LIMITS } from "@/lib/validation/report";

export const deliveryStatuses = ["delivered", "in_progress", "waiting_third_party", "blocked"] as const;

export const deliveryStatusMeta = {
  delivered: { label: "Entregue / Publicado", color: "#2E8B57" },
  in_progress: { label: "Em andamento", color: "#2F5D8A" },
  waiting_third_party: { label: "Aguardando terceiro", color: "#C77700" },
  blocked: { label: "Bloqueado", color: "#D7191C" },
} as const;

export const deliveryIcons = ["integration", "process", "routine", "code", "report", "server", "database", "cloud"] as const satisfies readonly ReportIconKey[];

export const deliverySchema = z.object({
  title: z.string().trim().min(1, "Informe o nome da entrega.").max(CONTENT_LIMITS.deliveryTitle, "Nome deve ter no máximo 60 caracteres."),
  description: z.string().trim().min(1, "Informe a descrição.").max(CONTENT_LIMITS.deliveryDescription, "Descrição deve ter no máximo 150 caracteres."),
  status: z.enum(deliveryStatuses, "Selecione o status."),
  iconKey: z.enum(reportIconKeys, "Selecione um ícone válido."),
});

export type DeliveryInput = z.infer<typeof deliverySchema>;

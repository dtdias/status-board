import { z } from "zod";

export const deliveryStatuses = ["delivered", "in_progress", "waiting_third_party", "blocked"] as const;

export const deliveryStatusMeta = {
  delivered: { label: "Entregue / Publicado", color: "#2E8B57" },
  in_progress: { label: "Em andamento", color: "#2F5D8A" },
  waiting_third_party: { label: "Aguardando terceiro", color: "#C77700" },
  blocked: { label: "Bloqueado", color: "#D7191C" },
} as const;

export const deliveryIcons = ["integration", "process", "routine", "code", "report", "server", "database", "cloud"] as const;

export const deliverySchema = z.object({
  title: z.string().trim().min(1, "Informe o nome da entrega.").max(60, "Nome deve ter no máximo 60 caracteres."),
  description: z.string().trim().min(1, "Informe a descrição.").max(150, "Descrição deve ter no máximo 150 caracteres."),
  status: z.enum(deliveryStatuses, "Selecione o status."),
  iconKey: z.enum(deliveryIcons, "Selecione o ícone."),
});

export type DeliveryInput = z.infer<typeof deliverySchema>;

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { orderedIdsSchema } from "@/lib/board/reorder";
import { createClient } from "@/lib/supabase/server";

const reorderDeliveriesSchema = z.object({
  reportId: z.uuid(),
  orderedIds: orderedIdsSchema,
});

export type ReorderDeliveriesResult = { error?: string };

export async function reorderDeliveries(input: unknown): Promise<ReorderDeliveriesResult> {
  const parsed = reorderDeliveriesSchema.safeParse(input);
  if (!parsed.success) return { error: "Ordem de entregas inválida." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou." };

  // Function runs as caller, so its select and update remain constrained by RLS.
  const { error } = await supabase.rpc("reorder_deliveries", {
    target_report_id: parsed.data.reportId,
    ordered_ids: parsed.data.orderedIds,
  });

  if (error) return { error: "Não foi possível salvar a nova ordem." };

  revalidatePath(`/app/reports/${parsed.data.reportId}`);
  return {};
}

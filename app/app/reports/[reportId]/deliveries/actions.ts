"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { deliverySchema } from "@/lib/deliveries/delivery";
import { createClient } from "@/lib/supabase/server";

export type DeliveryState = { error?: string };

export async function saveDelivery(_: DeliveryState, formData: FormData): Promise<DeliveryState> {
  const reportId = formData.get("reportId");
  const deliveryId = formData.get("deliveryId");
  const parsed = deliverySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    iconKey: formData.get("iconKey"),
  });

  if (typeof reportId !== "string" || !parsed.success) {
    return { error: parsed.success ? "Relatório inválido." : parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const values = {
    title: parsed.data.title,
    description: parsed.data.description,
    status: parsed.data.status,
    icon_key: parsed.data.iconKey,
  };

  if (typeof deliveryId === "string" && deliveryId) {
    const { error } = await supabase.from("deliveries").update(values).eq("id", deliveryId).eq("weekly_report_id", reportId);
    if (error) return { error: "Não foi possível atualizar a entrega." };
  } else {
    const { data: latest } = await supabase
      .from("deliveries")
      .select("position")
      .eq("weekly_report_id", reportId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("deliveries").insert({
      ...values,
      weekly_report_id: reportId,
      position: (latest?.position ?? -1) + 1,
    });
    if (error) return { error: "Não foi possível criar a entrega." };
  }

  revalidatePath(`/app/reports/${reportId}`);
  redirect(`/app/reports/${reportId}` as Route);
}

export async function deleteDelivery(formData: FormData) {
  const reportId = formData.get("reportId");
  const deliveryId = formData.get("deliveryId");

  if (typeof reportId !== "string" || typeof deliveryId !== "string") return;

  const supabase = await createClient();
  await supabase.from("deliveries").delete().eq("id", deliveryId).eq("weekly_report_id", reportId);
  revalidatePath(`/app/reports/${reportId}`);
  redirect(`/app/reports/${reportId}` as Route);
}

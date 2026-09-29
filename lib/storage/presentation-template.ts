import type { createClient } from "@/lib/supabase/server";

const TEMPLATE_BUCKET = "presentation-templates";
const TEMPLATE_PATH = "status-weekly/v1/template.pptx";
type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function getPresentationTemplateBuffer(supabase: Supabase): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(TEMPLATE_BUCKET).download(TEMPLATE_PATH);
  if (error || !data) throw new Error("Presentation template is unavailable.");
  return Buffer.from(await data.arrayBuffer());
}

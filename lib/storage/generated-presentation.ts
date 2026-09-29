import type { createClient } from "@/lib/supabase/server";

const GENERATED_PRESENTATIONS_BUCKET = "generated-presentations";
type Supabase = Awaited<ReturnType<typeof createClient>>;

export type GeneratedPresentation = {
  id: string;
  version: number;
  fileName: string;
  generatedAt: string;
};

type GeneratedPresentationRow = {
  id: string;
  version: number;
  storage_path: string;
  file_name: string;
  generated_at: string;
};

function mapPresentation(row: GeneratedPresentationRow): GeneratedPresentation {
  return { id: row.id, version: row.version, fileName: row.file_name, generatedAt: row.generated_at };
}

export function generatedPresentationPath(userId: string, reportId: string, version: number) {
  return `${userId}/${reportId}/v${version}.pptx`;
}

export function nextPresentationVersion(versions: number[]) {
  return versions.length ? Math.max(...versions) + 1 : 1;
}

export async function reserveGeneratedPresentation(supabase: Supabase, reportId: string, fileName: string) {
  const { data, error } = await supabase.rpc("reserve_generated_presentation", {
    target_report_id: reportId,
    target_file_name: fileName,
  });
  const presentation = data?.[0];
  if (error || !presentation) throw new Error("Unable to reserve presentation version.");
  return presentation;
}

export async function uploadGeneratedPresentation(supabase: Supabase, storagePath: string, output: Buffer) {
  const body = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  const { error } = await supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).upload(storagePath, body, {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    upsert: false,
  });
  if (error) throw new Error("Unable to upload presentation.");
}

export async function discardGeneratedPresentation(supabase: Supabase, presentationId: string, storagePath: string) {
  await Promise.all([
    supabase.from("generated_presentations").delete().eq("id", presentationId),
    supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).remove([storagePath]),
  ]);
}

export async function listGeneratedPresentations(supabase: Supabase, reportId: string) {
  const { data, error } = await supabase
    .from("generated_presentations")
    .select("id, version, storage_path, file_name, generated_at")
    .eq("weekly_report_id", reportId)
    .order("version", { ascending: false });
  if (error) throw new Error("Unable to load presentation history.");
  return (data ?? []).map(mapPresentation);
}

export async function downloadGeneratedPresentation(supabase: Supabase, reportId: string, presentationId: string) {
  const { data: presentation, error } = await supabase
    .from("generated_presentations")
    .select("id, version, storage_path, file_name, generated_at")
    .eq("weekly_report_id", reportId)
    .eq("id", presentationId)
    .maybeSingle();
  if (error) throw new Error("Unable to load presentation.");
  if (!presentation) return null;

  const { data, error: downloadError } = await supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).download(presentation.storage_path);
  if (downloadError || !data) throw new Error("Generated presentation is unavailable.");
  return { presentation: mapPresentation(presentation), body: Buffer.from(await data.arrayBuffer()) };
}

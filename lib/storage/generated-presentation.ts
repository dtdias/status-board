import type { createClient } from "@/lib/supabase/server";
import { generatePptx } from "@/lib/pptx/generate";
import type { PresentationInput } from "@/lib/pptx/types";
import { getPresentationTemplateBuffer } from "./presentation-template";

const GENERATED_PRESENTATIONS_BUCKET = "generated-presentations";
type Supabase = Awaited<ReturnType<typeof createClient>>;

export type GeneratedPresentation = {
  id: string;
  version: number;
  fileName: string;
  generatedAt: string;
  cachedUntil: string | null;
  storageDeletedAt: string | null;
  isFinal: boolean;
};

type GeneratedPresentationRow = {
  id: string;
  version: number;
  storage_path: string;
  file_name: string;
  generated_at: string;
  input_snapshot: unknown | null;
  template_version: string;
  cached_until: string | null;
  storage_deleted_at: string | null;
  is_final: boolean;
};

function mapPresentation(row: GeneratedPresentationRow): GeneratedPresentation {
  return { id: row.id, version: row.version, fileName: row.file_name, generatedAt: row.generated_at, cachedUntil: row.cached_until, storageDeletedAt: row.storage_deleted_at, isFinal: row.is_final };
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

export async function finalizeGeneratedPresentation(supabase: Supabase, presentationId: string, input: PresentationInput, templateVersion: string) {
  const { data, error } = await supabase.rpc("finalize_generated_presentation", {
    target_presentation_id: presentationId,
    target_snapshot: input,
    target_template_version: templateVersion,
  });
  const presentation = data?.[0];
  if (error || !presentation) throw new Error("Unable to finalize presentation recipe.");
  return presentation;
}

export async function markLatestPresentationFinal(supabase: Supabase, reportId: string) {
  const { error } = await supabase.rpc("mark_latest_presentation_final", { target_report_id: reportId });
  if (error) throw new Error("Unable to finalize presentation.");
}

export async function cleanupExpiredGeneratedPresentations(supabase: Supabase, reportId: string) {
  const { data, error } = await supabase
    .from("generated_presentations")
    .select("id, storage_path")
    .eq("weekly_report_id", reportId)
    .eq("is_final", false)
    .is("storage_deleted_at", null)
    .not("input_snapshot", "is", null)
    .lt("cached_until", new Date().toISOString());
  if (error) throw new Error("Unable to load expired presentations.");
  for (const presentation of data ?? []) {
    const { error: removeError } = await supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).remove([presentation.storage_path]);
    if (removeError) continue;
    await supabase.from("generated_presentations").update({ storage_deleted_at: new Date().toISOString() }).eq("id", presentation.id);
  }
}

export async function discardGeneratedPresentation(supabase: Supabase, presentationId: string, storagePath: string) {
  await Promise.all([
    supabase.from("generated_presentations").delete().eq("id", presentationId),
    supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).remove([storagePath]),
  ]);
}

export async function listGeneratedPresentations(supabase: Supabase, reportId: string) {
  await cleanupExpiredGeneratedPresentations(supabase, reportId);
  const { data, error } = await supabase
    .from("generated_presentations")
    .select("id, version, storage_path, file_name, generated_at, input_snapshot, template_version, cached_until, storage_deleted_at, is_final")
    .eq("weekly_report_id", reportId)
    .order("version", { ascending: false });
  if (error) throw new Error("Unable to load presentation history.");
  return (data ?? []).map(mapPresentation);
}

export async function downloadGeneratedPresentation(supabase: Supabase, reportId: string, presentationId: string) {
  const { data: presentation, error } = await supabase
    .from("generated_presentations")
    .select("id, version, storage_path, file_name, generated_at, input_snapshot, template_version, cached_until, storage_deleted_at, is_final")
    .eq("weekly_report_id", reportId)
    .eq("id", presentationId)
    .maybeSingle();
  if (error) throw new Error("Unable to load presentation.");
  if (!presentation) return null;

  let { data } = await supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).download(presentation.storage_path);
  if (!data) {
    if (!presentation.input_snapshot) throw new Error("Generated presentation is unavailable.");
    const output = await generatePptx(presentation.input_snapshot as PresentationInput, await getPresentationTemplateBuffer(supabase, presentation.template_version));
    const body = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
    const { error: uploadError } = await supabase.storage.from(GENERATED_PRESENTATIONS_BUCKET).upload(presentation.storage_path, body, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true,
    });
    if (uploadError) throw new Error("Unable to rebuild presentation.");
    const cachedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: cacheError } = await supabase.from("generated_presentations").update({ cached_until: cachedUntil, storage_deleted_at: null }).eq("id", presentation.id);
    if (cacheError) throw new Error("Unable to update presentation cache.");
    presentation.cached_until = cachedUntil;
    presentation.storage_deleted_at = null;
    data = new Blob([body]);
  }
  return { presentation: mapPresentation(presentation), body: Buffer.from(await data.arrayBuffer()) };
}

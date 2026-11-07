import type { createClient } from "@/lib/supabase/server";
import { assertTemplateIntegrity } from "@/lib/pptx/integrity";
import { DEFAULT_THEME_ID, isThemeId, PRESENTATION_THEMES, type PresentationThemeId } from "@/lib/pptx/themes";

export const TEMPLATE_BUCKET = "presentation-templates";
export const PPTX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export const MAX_TEMPLATE_BYTES = 25 * 1024 * 1024;
const DEFAULT_TEMPLATE_VERSION = "v1";
type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PresentationTemplateUpload = {
  version: string;
  theme?: string;
  fileName: string;
  contentType: string;
  body: Buffer;
};

export function presentationTemplatePath(version: string, theme: string = DEFAULT_THEME_ID) {
  if (!/^v[1-9]\d*(?:\.\d+)*$/.test(version)) throw new Error("Template version must use the v1 or v1.0 format.");
  if (!isThemeId(theme)) throw new Error("Template theme is not supported.");
  return theme === DEFAULT_THEME_ID ? `status-weekly/${version}/template.pptx` : `status-weekly/${version}/themes/${theme}.pptx`;
}

export async function listAvailableThemeIds(supabase: Supabase, version = configuredTemplateVersion()): Promise<PresentationThemeId[]> {
  presentationTemplatePath(version);
  const { data, error } = await supabase.storage.from(TEMPLATE_BUCKET).list(`status-weekly/${version}/themes`, { limit: 100 });
  const published = new Set((error ? [] : data ?? []).map((entry) => entry.name.replace(/\.pptx$/, "")));
  // The base theme is the version's own template.pptx and is always offered.
  return PRESENTATION_THEMES.map((theme) => theme.id).filter((id) => id === DEFAULT_THEME_ID || published.has(id));
}

export function configuredTemplateVersion() {
  return process.env.PPTX_TEMPLATE_VERSION || DEFAULT_TEMPLATE_VERSION;
}

export async function validatePresentationTemplateUpload(upload: PresentationTemplateUpload) {
  presentationTemplatePath(upload.version, upload.theme);
  if (!upload.fileName.toLowerCase().endsWith(".pptx")) throw new Error("Template file must use the .pptx extension.");
  if (upload.contentType !== PPTX_CONTENT_TYPE) throw new Error("Template file must use the PPTX content type.");
  if (!upload.body.length || upload.body.length > MAX_TEMPLATE_BYTES) throw new Error("Template file size is invalid.");
  await assertTemplateIntegrity(upload.body);
}

export async function uploadPresentationTemplate(supabase: Supabase, upload: PresentationTemplateUpload) {
  await validatePresentationTemplateUpload(upload);
  const body = upload.body.buffer.slice(upload.body.byteOffset, upload.body.byteOffset + upload.body.byteLength) as ArrayBuffer;
  const { error } = await supabase.storage.from(TEMPLATE_BUCKET).upload(presentationTemplatePath(upload.version, upload.theme), body, {
    contentType: PPTX_CONTENT_TYPE,
    upsert: false,
  });
  if (error) throw new Error("Unable to upload presentation template.");
}

export async function getPresentationTemplateBuffer(supabase: Supabase, version = configuredTemplateVersion(), theme: string = DEFAULT_THEME_ID): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(TEMPLATE_BUCKET).download(presentationTemplatePath(version, theme));
  if (error || !data) throw new Error("Presentation template is unavailable.");
  return Buffer.from(await data.arrayBuffer());
}

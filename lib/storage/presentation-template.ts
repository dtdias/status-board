import type { createClient } from "@/lib/supabase/server";
import { assertTemplateIntegrity } from "@/lib/pptx/integrity";

export const TEMPLATE_BUCKET = "presentation-templates";
export const PPTX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export const MAX_TEMPLATE_BYTES = 25 * 1024 * 1024;
const DEFAULT_TEMPLATE_VERSION = "v1";
type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PresentationTemplateUpload = {
  version: string;
  fileName: string;
  contentType: string;
  body: Buffer;
};

export function presentationTemplatePath(version: string) {
  if (!/^v[1-9]\d*(?:\.\d+)*$/.test(version)) throw new Error("Template version must use the v1 or v1.0 format.");
  return `status-weekly/${version}/template.pptx`;
}

export function configuredTemplateVersion() {
  return process.env.PPTX_TEMPLATE_VERSION || DEFAULT_TEMPLATE_VERSION;
}

export async function validatePresentationTemplateUpload(upload: PresentationTemplateUpload) {
  presentationTemplatePath(upload.version);
  if (!upload.fileName.toLowerCase().endsWith(".pptx")) throw new Error("Template file must use the .pptx extension.");
  if (upload.contentType !== PPTX_CONTENT_TYPE) throw new Error("Template file must use the PPTX content type.");
  if (!upload.body.length || upload.body.length > MAX_TEMPLATE_BYTES) throw new Error("Template file size is invalid.");
  await assertTemplateIntegrity(upload.body);
}

export async function uploadPresentationTemplate(supabase: Supabase, upload: PresentationTemplateUpload) {
  await validatePresentationTemplateUpload(upload);
  const body = upload.body.buffer.slice(upload.body.byteOffset, upload.body.byteOffset + upload.body.byteLength) as ArrayBuffer;
  const { error } = await supabase.storage.from(TEMPLATE_BUCKET).upload(presentationTemplatePath(upload.version), body, {
    contentType: PPTX_CONTENT_TYPE,
    upsert: false,
  });
  if (error) throw new Error("Unable to upload presentation template.");
}

export async function getPresentationTemplateBuffer(supabase: Supabase, version = configuredTemplateVersion()): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(TEMPLATE_BUCKET).download(presentationTemplatePath(version));
  if (error || !data) throw new Error("Presentation template is unavailable.");
  return Buffer.from(await data.arrayBuffer());
}

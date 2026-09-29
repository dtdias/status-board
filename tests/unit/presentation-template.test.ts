import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { MAX_TEMPLATE_BYTES, PPTX_CONTENT_TYPE, presentationTemplatePath, validatePresentationTemplateUpload } from "@/lib/storage/presentation-template";

async function templateBuffer() {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", "<Types />");
  zip.file("ppt/presentation.xml", `<p:presentation><p:sldIdLst>${"<p:sldId />".repeat(10)}</p:sldIdLst></p:presentation>`);
  for (let index = 1; index <= 10; index += 1) zip.file(`ppt/slides/slide${index}.xml`, "<p:sld />");
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("presentation template storage", () => {
  it("uses an immutable, versioned storage path", () => {
    expect(presentationTemplatePath("v1")).toBe("status-weekly/v1/template.pptx");
    expect(presentationTemplatePath("v1.0")).toBe("status-weekly/v1.0/template.pptx");
    expect(() => presentationTemplatePath("../../other")).toThrow("Template version");
  });

  it("accepts a valid PPTX template upload", async () => {
    await expect(validatePresentationTemplateUpload({ version: "v1", fileName: "Template.pptx", contentType: PPTX_CONTENT_TYPE, body: await templateBuffer() })).resolves.toBeUndefined();
  });

  it("rejects invalid extension, MIME type, size, and ZIP content", async () => {
    const body = await templateBuffer();
    await expect(validatePresentationTemplateUpload({ version: "v1", fileName: "Template.zip", contentType: PPTX_CONTENT_TYPE, body })).rejects.toThrow(".pptx");
    await expect(validatePresentationTemplateUpload({ version: "v1", fileName: "Template.pptx", contentType: "application/zip", body })).rejects.toThrow("content type");
    await expect(validatePresentationTemplateUpload({ version: "v1", fileName: "Template.pptx", contentType: PPTX_CONTENT_TYPE, body: Buffer.alloc(MAX_TEMPLATE_BYTES + 1) })).rejects.toThrow("size");
    await expect(validatePresentationTemplateUpload({ version: "v1", fileName: "Template.pptx", contentType: PPTX_CONTENT_TYPE, body: Buffer.from("not a ZIP") })).rejects.toThrow("valid PPTX ZIP");
  });
});

import JSZip from "jszip";

export async function assertPptxIntegrity(buffer: Buffer, expectedSlides?: number) {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  } catch {
    throw new Error("Generated file is not a valid PPTX ZIP archive.");
  }

  const presentation = zip.file("ppt/presentation.xml");
  const contentTypes = zip.file("[Content_Types].xml");
  if (!presentation || !contentTypes) throw new Error("Generated file is missing required PPTX XML parts.");

  const presentationXml = await presentation.async("string");
  const slideCount = (presentationXml.match(/<p:sldId\b/g) ?? []).length;
  if (expectedSlides !== undefined && slideCount !== expectedSlides) {
    throw new Error(`Generated presentation has ${slideCount} slides; expected ${expectedSlides}.`);
  }

  const slideFiles = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path));
  if (slideFiles.length !== slideCount) throw new Error("Generated presentation slide XML parts do not match the presentation slide count.");
  return { slideCount, slideFiles };
}

export async function assertTemplateIntegrity(buffer: Buffer) {
  const { slideFiles } = await assertPptxIntegrity(buffer);
  if (slideFiles.length < 10) throw new Error("Presentation template must contain all 10 mapped slides.");
}

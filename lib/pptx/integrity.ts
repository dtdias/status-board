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

  const relationships = zip.file("ppt/_rels/presentation.xml.rels");
  let slideFiles: string[];
  if (relationships) {
    const relationshipXml = await relationships.async("string");
    const ids = [...presentationXml.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)].map((match) => match[1]);
    const targets = new Map([...relationshipXml.matchAll(/<Relationship\b(?=[^>]*\bId="([^"]+)")(?=[^>]*\bTarget="([^"]+)")[^>]*\/>/g)].map((match) => [match[1], match[2]]));
    slideFiles = ids.map((id) => `ppt/${targets.get(id)}`);
  } else {
    slideFiles = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path));
  }
  if (slideFiles.length !== slideCount) throw new Error("Generated presentation slide XML parts do not match the presentation slide count.");
  if (slideFiles.some((path) => !zip.file(path))) throw new Error("Generated presentation references missing slide XML parts.");
  return { slideCount, slideFiles };
}

export async function assertTemplateIntegrity(buffer: Buffer) {
  const { slideFiles } = await assertPptxIntegrity(buffer);
  if (slideFiles.length < 10) throw new Error("Presentation template must contain all 10 mapped slides.");
}

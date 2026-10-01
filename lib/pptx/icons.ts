import JSZip from "jszip";
import { posix } from "node:path";
import { getReportIcon, reportIconCatalog, type ReportIconKey } from "@/lib/icons/report-icons";

export function iconSource(iconKey: string): { slide: number; name: string } | null {
  const icon = getReportIcon(iconKey);
  return icon ? { slide: icon.slide, name: icon.shape } : null;
}

export type TemplateIconMedia = { fileName: string; buffer: Buffer };

function attribute(tag: string | undefined, name: string) {
  if (!tag) return undefined;
  return tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

export async function readTemplateIconMedia(templateBuffer: Buffer): Promise<Map<ReportIconKey, TemplateIconMedia>> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const media = new Map<ReportIconKey, TemplateIconMedia>();

  for (const icon of reportIconCatalog) {
    const slidePath = `ppt/slides/slide${icon.slide}.xml`;
    const relationshipsPath = `ppt/slides/_rels/slide${icon.slide}.xml.rels`;
    const slideFile = zip.file(slidePath);
    const relationshipsFile = zip.file(relationshipsPath);
    if (!slideFile || !relationshipsFile) throw new Error(`Template is missing the icon library slide ${icon.slide}.`);

    const slideXml = await slideFile.async("string");
    const picture = [...slideXml.matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)]
      .map((match) => match[0])
      .find((element) => attribute(element.match(/<p:cNvPr\b[^>]*>/)?.[0], "name") === icon.shape);
    if (!picture) throw new Error(`Template icon ${icon.key} (${icon.shape}) was not found on slide ${icon.slide}.`);

    const relationshipId = attribute(picture.match(/<a:blip\b[^>]*>/)?.[0], "r:embed");
    const relationshipsXml = await relationshipsFile.async("string");
    const relationship = [...relationshipsXml.matchAll(/<Relationship\b[^>]*\/?\s*>/g)]
      .map((match) => match[0])
      .find((element) => attribute(element, "Id") === relationshipId);
    const target = attribute(relationship, "Target");
    if (!target || target.startsWith("http:") || target.startsWith("https:")) throw new Error(`Template icon ${icon.key} has no internal media relationship.`);

    const mediaPath = posix.normalize(posix.join(posix.dirname(slidePath), target));
    if (!mediaPath.startsWith("ppt/media/")) throw new Error(`Template icon ${icon.key} points outside ppt/media/.`);
    const mediaFile = zip.file(mediaPath);
    if (!mediaFile) throw new Error(`Template icon media is missing: ${mediaPath}.`);
    const buffer = await mediaFile.async("nodebuffer");
    if (buffer.length < 8 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error(`Template icon ${icon.key} is not a PNG image.`);
    }

    media.set(icon.key, { fileName: posix.basename(mediaPath), buffer });
  }

  return media;
}

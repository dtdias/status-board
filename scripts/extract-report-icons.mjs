import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import JSZip from "jszip";
import { reportIconCatalog } from "../lib/icons/report-icons.ts";

function attribute(tag, name) {
  if (!tag) return undefined;
  return tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

const root = process.cwd();
const templatePath = resolve(root, "Template(1).pptx");
const zip = await JSZip.loadAsync(await readFile(templatePath));
const outputDirectory = resolve(root, "public/report-icons");
await mkdir(outputDirectory, { recursive: true });

for (const icon of reportIconCatalog) {
  const slidePath = `ppt/slides/slide${icon.slide}.xml`;
  const slide = zip.file(slidePath);
  const relationships = zip.file(`ppt/slides/_rels/slide${icon.slide}.xml.rels`);
  if (!slide || !relationships) throw new Error(`Template slide ${icon.slide} is missing.`);

  const xml = await slide.async("string");
  const picture = [...xml.matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)]
    .map((match) => match[0])
    .find((element) => attribute(element.match(/<p:cNvPr\b[^>]*>/)?.[0], "name") === icon.shape);
  if (!picture) throw new Error(`Template icon ${icon.key} not found (${icon.shape}).`);

  const relationshipId = attribute(picture.match(/<a:blip\b[^>]*>/)?.[0], "r:embed");
  const relXml = await relationships.async("string");
  const relationship = [...relXml.matchAll(/<Relationship\b[^>]*\/?\s*>/g)]
    .map((match) => match[0])
    .find((element) => attribute(element, "Id") === relationshipId);
  const target = attribute(relationship, "Target");
  if (!target || target.startsWith("http:") || target.startsWith("https:")) throw new Error(`Template icon ${icon.key} has no internal image.`);

  const mediaPath = posix.normalize(posix.join(posix.dirname(slidePath), target));
  if (!mediaPath.startsWith("ppt/media/")) throw new Error(`Template icon ${icon.key} points outside ppt/media/.`);
  const media = zip.file(mediaPath);
  if (!media) throw new Error(`Template image missing: ${mediaPath}.`);
  const png = await media.async("nodebuffer");
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`Template image is not PNG: ${mediaPath}.`);
  await writeFile(join(outputDirectory, `${icon.key}.png`), png);
}

console.info(`Extracted ${reportIconCatalog.length} reviewed template icons to ${dirname(outputDirectory)}.`);

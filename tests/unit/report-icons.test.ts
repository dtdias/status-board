import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getReportIcon, isReportIconKey, reportIconCatalog, reportIconPath } from "@/lib/icons/report-icons";
import { iconSource, readTemplateIconMedia } from "@/lib/pptx/icons";

const templatePath = resolve(process.cwd(), "Template(1).pptx");
const assetsPath = resolve(process.cwd(), "public/report-icons");

describe("report icon catalog", () => {
  it("maps 48 unique template images to labelled keys", () => {
    expect(reportIconCatalog).toHaveLength(48);
    expect(new Set(reportIconCatalog.map((icon) => icon.key)).size).toBe(48);
    expect(reportIconCatalog.every((icon) => icon.label.length > 0)).toBe(true);
    expect(isReportIconKey("integration")).toBe(true);
    expect(isReportIconKey("not-in-template")).toBe(false);
    expect(iconSource("integration")).toEqual({ slide: 2, name: "Image 7" });
    expect(iconSource("demand")).toEqual({ slide: 3, name: "Image 8" });
    expect(iconSource("not-in-template")).toBeNull();
    expect(getReportIcon("integration")?.label).toBe("Integração");
    expect(reportIconPath("incident")).toBe("/report-icons/incident.png");
  });

  it("ships exact PNG media from the reviewed master for every web icon", async () => {
    expect(existsSync(templatePath)).toBe(true);
    const media = await readTemplateIconMedia(readFileSync(templatePath));
    expect(media.size).toBe(48);

    for (const icon of reportIconCatalog) {
      const extracted = media.get(icon.key);
      if (!extracted) throw new Error(`Template icon ${icon.key} was not extracted.`);
      const assetPath = resolve(assetsPath, `${icon.key}.png`);
      expect(existsSync(assetPath), `${icon.key} asset exists`).toBe(true);
      expect(readFileSync(assetPath).equals(extracted.buffer), `${icon.key} matches master media`).toBe(true);
    }
  });
});

import { describe, expect, it, vi } from "vitest";
import { DEFAULT_THEME_ID, generateRequestSchema, isThemeId, normalizeThemeId, themeById } from "@/lib/pptx/themes";
import { listAvailableThemeIds, presentationTemplatePath, validatePresentationTemplateUpload } from "@/lib/storage/presentation-template";

describe("theme ids", () => {
  it("accepts only catalog ids and falls back to the base theme", () => {
    expect(isThemeId("navy-corporate")).toBe(true);
    expect(isThemeId("../../etc/passwd")).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
    expect(normalizeThemeId("nope")).toBe(DEFAULT_THEME_ID);
    expect(normalizeThemeId(null)).toBe(DEFAULT_THEME_ID);
    expect(themeById("unknown").id).toBe(DEFAULT_THEME_ID);
  });

  it("validates the generate request body and defaults the theme", () => {
    expect(generateRequestSchema.parse({})).toEqual({ theme: "base" });
    expect(generateRequestSchema.parse({ theme: "warm-terracotta" })).toEqual({ theme: "warm-terracotta" });
    expect(generateRequestSchema.safeParse({ theme: "pink" }).success).toBe(false);
    expect(generateRequestSchema.safeParse({ theme: 3 }).success).toBe(false);
  });
});

describe("theme storage paths", () => {
  it("keeps the base template path and nests other themes under themes/", () => {
    expect(presentationTemplatePath("v1")).toBe("status-weekly/v1/template.pptx");
    expect(presentationTemplatePath("v1", "base")).toBe("status-weekly/v1/template.pptx");
    expect(presentationTemplatePath("v2.1", "light-minimal")).toBe("status-weekly/v2.1/themes/light-minimal.pptx");
  });

  it("rejects unknown themes and path traversal", () => {
    expect(() => presentationTemplatePath("v1", "../template")).toThrow("theme");
    expect(() => presentationTemplatePath("v1", "pink")).toThrow("theme");
    expect(() => presentationTemplatePath("../v1", "navy-corporate")).toThrow("Template version");
  });

  it("validates the theme on upload", async () => {
    await expect(validatePresentationTemplateUpload({ version: "v1", theme: "pink", fileName: "a.pptx", contentType: "x", body: Buffer.alloc(1) })).rejects.toThrow("theme");
  });
});

describe("listAvailableThemeIds", () => {
  function supabaseWith(list: ReturnType<typeof vi.fn>) {
    return { storage: { from: vi.fn(() => ({ list })) } } as unknown as Parameters<typeof listAvailableThemeIds>[0];
  }

  it("always offers base and adds only themes published in storage, in catalog order", async () => {
    const list = vi.fn().mockResolvedValue({ data: [{ name: "warm-terracotta.pptx" }, { name: "navy-corporate.pptx" }, { name: "stray.pptx" }], error: null });
    await expect(listAvailableThemeIds(supabaseWith(list), "v1")).resolves.toEqual(["base", "navy-corporate", "warm-terracotta"]);
    expect(list).toHaveBeenCalledWith("status-weekly/v1/themes", { limit: 100 });
  });

  it("falls back to base when the listing fails", async () => {
    const list = vi.fn().mockResolvedValue({ data: null, error: new Error("denied") });
    await expect(listAvailableThemeIds(supabaseWith(list), "v1")).resolves.toEqual(["base"]);
  });
});

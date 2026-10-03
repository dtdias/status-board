import { describe, expect, it } from "vitest";
import { classifyPptxGenerationError } from "@/lib/pptx/generation-error";

describe("classifyPptxGenerationError", () => {
  it("returns a safe, retriable response for template and storage failures", () => {
    expect(classifyPptxGenerationError("template", new Error("storage details"))).toMatchObject({ code: "template_unavailable", status: 503 });
    expect(classifyPptxGenerationError("upload", new Error("storage details"))).toMatchObject({ code: "storage_unavailable", status: 503 });
    expect(classifyPptxGenerationError("finalize", new Error("database details"))).toMatchObject({ code: "storage_unavailable", status: 503 });
    expect(classifyPptxGenerationError("status", new Error("database details"))).toMatchObject({ code: "storage_unavailable", status: 503 });
  });

  it("does not expose internal generation errors", () => {
    const failure = classifyPptxGenerationError("generate", new Error("template content should stay private"));
    expect(failure).toEqual({ code: "generation_failed", message: "The presentation could not be generated. Try again shortly.", status: 500 });
  });
});

import { describe, expect, it } from "vitest";
import { generatedPresentationPath, nextPresentationVersion } from "@/lib/storage/generated-presentation";

describe("generated presentation history", () => {
  it("uses a report-scoped storage path for each version", () => {
    expect(generatedPresentationPath("user-1", "report-1", 3)).toBe("user-1/report-1/v3.pptx");
  });

  it("increments the highest existing version", () => {
    expect(nextPresentationVersion([])).toBe(1);
    expect(nextPresentationVersion([1, 3, 2])).toBe(4);
  });
});

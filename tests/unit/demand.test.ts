import { expect, it } from "vitest";
import { phaseTone } from "@/lib/demands/demand";
it("derives phase tones", () => { expect(phaseTone("request_received", "development")).toBe("done"); expect(phaseTone("development", "development")).toBe("current"); expect(phaseTone("validation", "development")).toBe("future"); });

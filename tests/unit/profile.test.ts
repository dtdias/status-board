import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/validation/profile";

describe("profileSchema", () => {
  it("accepts a profile with name and area", () => {
    expect(profileSchema.parse({ name: "João Silva", area: "Tecnologia" })).toEqual({
      name: "João Silva",
      area: "Tecnologia",
    });
  });

  it("trims saved values", () => {
    expect(profileSchema.parse({ name: "  João Silva  ", area: "  Tecnologia  " })).toEqual({
      name: "João Silva",
      area: "Tecnologia",
    });
  });

  it("rejects missing profile fields", () => {
    expect(profileSchema.safeParse({ name: "", area: "" }).success).toBe(false);
  });

  it("rejects values longer than the profile limits", () => {
    expect(profileSchema.safeParse({ name: "a".repeat(81), area: "Tecnologia" }).success).toBe(false);
  });
});

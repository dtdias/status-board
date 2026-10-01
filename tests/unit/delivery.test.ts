import { describe, expect, it } from "vitest";
import { deliverySchema, deliveryStatusMeta } from "@/lib/deliveries/delivery";

const validDelivery = { title: "Integração ERP", description: "Publicação da integração de estoque.", status: "delivered", iconKey: "integration" };

describe("deliverySchema", () => {
  it("accepts required delivery fields", () => expect(deliverySchema.parse(validDelivery)).toEqual(validDelivery));
  it("rejects descriptions over 150 characters", () => expect(deliverySchema.safeParse({ ...validDelivery, description: "a".repeat(151) }).success).toBe(false));
  it("rejects invalid statuses", () => expect(deliverySchema.safeParse({ ...validDelivery, status: "done" }).success).toBe(false));
  it("rejects icon keys outside the template library", () => expect(deliverySchema.safeParse({ ...validDelivery, iconKey: "not-in-template" }).success).toBe(false));
});

describe("deliveryStatusMeta", () => {
  it("uses PRD color for blocked work", () => expect(deliveryStatusMeta.blocked.color).toBe("#D7191C"));
});

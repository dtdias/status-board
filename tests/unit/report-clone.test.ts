import { describe, expect, it } from "vitest";
import { selectCloneContent } from "@/lib/reports/clone";

const content = {
  deliveries: [{ id: "delivered", status: "delivered" }, { id: "active", status: "blocked" }],
  incidents: [{ id: "resolved", status: "resolved" }, { id: "open", status: "in_progress" }],
  demands: [{ id: "demand" }],
  supportFronts: [{ id: "front" }],
  supportRoutines: [{ id: "routine" }],
  dependencies: [{ id: "dependency" }],
  nextSteps: [{ id: "next-step" }],
};

describe("selectCloneContent", () => {
  it("keeps every group empty for an empty report", () => {
    expect(selectCloneContent("empty", content)).toEqual({ deliveries: [], incidents: [], demands: [], supportFronts: [], supportRoutines: [], dependencies: [], nextSteps: [] });
  });

  it("copies only active delivery and incident items", () => {
    const clone = selectCloneContent("in_progress", content);
    expect(clone.deliveries.map((item) => item.id)).toEqual(["active"]);
    expect(clone.incidents.map((item) => item.id)).toEqual(["open"]);
    expect(clone.demands).toEqual([]);
  });

  it("copies support together with its routines", () => {
    const clone = selectCloneContent("support", content);
    expect(clone.supportFronts).toEqual(content.supportFronts);
    expect(clone.supportRoutines).toEqual(content.supportRoutines);
    expect(clone.nextSteps).toEqual([]);
  });

  it("copies dependencies and next steps only", () => {
    const clone = selectCloneContent("next_steps", content);
    expect(clone.dependencies).toEqual(content.dependencies);
    expect(clone.nextSteps).toEqual(content.nextSteps);
    expect(clone.deliveries).toEqual([]);
  });

  it("copies every allowed group but excludes delivered and resolved records", () => {
    const clone = selectCloneContent("all_previous", content);
    expect(clone.deliveries.map((item) => item.id)).toEqual(["active"]);
    expect(clone.incidents.map((item) => item.id)).toEqual(["open"]);
    expect(clone.demands).toEqual(content.demands);
    expect(clone.supportFronts).toEqual(content.supportFronts);
    expect(clone.dependencies).toEqual(content.dependencies);
    expect(clone.nextSteps).toEqual(content.nextSteps);
  });
});

import { describe, expect, it } from "vitest";
import { calculateReportSummary, type ReportSummaryInput } from "@/lib/reports/summary";

describe("calculateReportSummary", () => {
  it("derives every metric from report content", () => {
    const input: ReportSummaryInput = {
      deliveries: [{}, {}],
      incidents: [{ status: "resolved" }, { status: "in_progress" }, { status: "resolved" }],
      demands: [{}],
      supportFronts: [{ routines: [{}, {}] }, { routines: [{}] }],
    };

    expect(calculateReportSummary(input)).toEqual({
      deliveries: 2,
      resolvedIncidents: 2,
      newDemands: 1,
      supportRoutines: 3,
    });
  });

  it("returns zeroes for an empty report", () => {
    expect(calculateReportSummary({ deliveries: [], incidents: [], demands: [], supportFronts: [] })).toEqual({
      deliveries: 0,
      resolvedIncidents: 0,
      newDemands: 0,
      supportRoutines: 0,
    });
  });
});

import { describe, expect, it } from "vitest";
import { formatWeekRange, reportDetailsSchema, weeklyReportSchema } from "@/lib/reports/weekly-report";

describe("weeklyReportSchema", () => {
  const validInput = {
    startDate: "2026-09-21",
    endDate: "2026-09-27",
    presentationDate: "2026-09-29",
  };

  it("accepts the required report dates", () => {
    expect(weeklyReportSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects an end date before the start date", () => {
    expect(weeklyReportSchema.safeParse({ ...validInput, endDate: "2026-09-20" }).success).toBe(false);
  });

  it("rejects a missing presentation date", () => {
    expect(weeklyReportSchema.safeParse({ ...validInput, presentationDate: "" }).success).toBe(false);
  });
});

describe("reportDetailsSchema", () => {
  it("accepts the required editable report details", () => {
    expect(reportDetailsSchema.safeParse({ startDate: "2026-09-21", endDate: "2026-09-27", presentationDate: "2026-09-29", highlight: "Integração ERP publicada" }).success).toBe(true);
  });

  it("requires a highlight, valid dates, and a valid date range", () => {
    const result = reportDetailsSchema.safeParse({ startDate: "2026-09-28", endDate: "2026-09-27", presentationDate: "invalid", highlight: " " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ["highlight"] }),
        expect.objectContaining({ path: ["presentationDate"] }),
        expect.objectContaining({ path: ["endDate"] }),
      ]));
    }
  });
});

describe("formatWeekRange", () => {
  it("formats the report period for pt-BR", () => {
    expect(formatWeekRange("2026-09-21", "2026-09-27")).toBe("21 de set. de 2026 a 27 de set. de 2026");
  });
});

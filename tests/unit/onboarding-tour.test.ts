import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ONBOARDING_TOUR_VERSION, onboardingTourSteps, formTourForPath, tourRouteMatches } from "@/lib/onboarding/tour";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("first access tour", () => {
  it("keeps principal flow ordered and route-aware", () => {
    expect(ONBOARDING_TOUR_VERSION).toBe(1);
    expect(onboardingTourSteps.map((step) => step.id)).toEqual([
      "new-week", "start-date", "end-date", "presentation-date", "highlight", "clone-mode", "create-week", "board-overview", "board-deliveries", "board-incidents", "board-demands", "board-support", "board-dependencies", "board-next-steps", "edit-highlight", "preview", "mark-ready", "generate-pptx",
    ]);
    expect(tourRouteMatches("dashboard", "/app")).toBe(true);
    expect(tourRouteMatches("new-report", "/app/reports/new")).toBe(true);
    expect(tourRouteMatches("report", "/app/reports/report-id")).toBe(true);
    expect(tourRouteMatches("report", "/app/reports/new")).toBe(false);
    expect(formTourForPath("/app/reports/report-id/deliveries/new")?.id).toBe("delivery");
    expect(formTourForPath("/app/reports/report-id/incidents/new")?.id).toBe("incident");
    expect(formTourForPath("/app/reports/report-id/demands/new")?.id).toBe("demand");
    expect(formTourForPath("/app/reports/report-id/support-fronts/new")?.id).toBe("support-front");
    expect(formTourForPath("/app/reports/report-id/support-fronts/front-id")?.id).toBe("support-routine");
    expect(formTourForPath("/app/reports/report-id/attention/dependencies/new")?.id).toBe("dependency");
    expect(formTourForPath("/app/reports/report-id/attention/next-steps/new")?.id).toBe("next-step");
  });

  it("persists tour version and anchors controls", () => {
    const migration = read("supabase/migrations/20261008100000_first_access_tour.sql");
    const layout = read("app/app/layout.tsx");
    const tour = read("components/onboarding/guided-tour.tsx");
    const dashboard = read("app/app/page.tsx");
    const settings = read("app/app/settings/page.tsx");
    expect(migration).toContain("onboarding_tour_seen_version");
    expect(migration).toContain("onboarding_tour_completed_at");
    expect(layout).toContain("<GuidedTour");
    expect(tour).toContain("sessionStorage");
    expect(tour).toContain('role="dialog"');
    expect(tour).toContain('aria-modal="false"');
    expect(tour).toContain("useFloating");
    expect(tour).toContain("dialogRef.current?.focus()");
    expect(dashboard).toContain('data-tour="new-week"');
    expect(settings).toContain('href={"/app?tour=1" as Route}');
    const reportForm = read("app/app/reports/new/report-form.tsx");
    expect(reportForm).toContain('data-tour="start-date"');
    expect(reportForm).toContain('data-tour="end-date"');
    expect(reportForm).toContain('data-tour="presentation-date"');
    expect(reportForm).toContain('data-tour="highlight"');
    expect(reportForm).toContain('data-tour="clone-options"');
    const board = read("app/app/reports/[reportId]/page.tsx");
    expect(board).toContain('dataTour="board-incidents"');
    expect(board).toContain('data-tour="board-dependencies"');
    expect(tour).not.toContain("Focar Criar semana");
  });
});

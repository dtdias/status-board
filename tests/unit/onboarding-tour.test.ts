import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ONBOARDING_TOUR_VERSION, onboardingTourSteps, tourRouteMatches } from "@/lib/onboarding/tour";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("first access tour", () => {
  it("keeps principal flow ordered and route-aware", () => {
    expect(ONBOARDING_TOUR_VERSION).toBe(1);
    expect(onboardingTourSteps.map((step) => step.id)).toEqual([
      "new-week", "clone-mode", "create-week", "add-delivery", "edit-highlight", "preview", "mark-ready", "generate-pptx",
    ]);
    expect(tourRouteMatches("dashboard", "/app")).toBe(true);
    expect(tourRouteMatches("new-report", "/app/reports/new")).toBe(true);
    expect(tourRouteMatches("report", "/app/reports/report-id")).toBe(true);
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
    expect(dashboard).toContain('data-tour="new-week"');
    expect(settings).toContain('href={"/app?tour=1" as Route}');
  });
});

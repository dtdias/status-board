import { calculateReportSummary } from "@/lib/reports/summary";
import type { PresentationInput } from "./types";

export type PresentationSection = "cover" | "summary" | "deliveries" | "incidents" | "demands" | "support" | "attention";

export const statusColors = {
  delivered: "#2E8B57",
  resolved: "#2E8B57",
  in_progress: "#2F5D8A",
  waiting_third_party: "#C77700",
  blocked: "#D7191C",
} as const;

export function demandPhaseColors(currentPhase: "request_received" | "feasibility_requirements" | "development" | "validation") {
  const phases = ["request_received", "feasibility_requirements", "development", "validation"];
  const current = phases.indexOf(currentPhase);
  return phases.map((_, index) => index < current ? "#2E8B57" : index === current ? "#FFD400" : "#A6A6A6");
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks.length ? chunks : [[]];
}

export function composePresentationSections(input: PresentationInput): PresentationSection[] {
  return [
    "cover" as const,
    "summary" as const,
    ...chunk(input.deliveries, 4).map<PresentationSection>(() => "deliveries"),
    ...chunk(input.incidents, 2).map<PresentationSection>(() => "incidents"),
    ...(input.demands.length ? input.demands.map<PresentationSection>(() => "demands") : ["demands" as const]),
    ...chunk(input.supportFronts, 2).map<PresentationSection>(() => "support"),
    "attention" as const,
  ];
}

export function presentationSummary(input: PresentationInput) {
  return calculateReportSummary(input);
}

export function presentationFileName(input: PresentationInput) {
  const name = input.report.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "status-semanal";
  return `${name}-${input.report.startDate}.pptx`;
}

export type ReportSummaryInput = {
  deliveries: readonly unknown[];
  incidents: readonly { status: string }[];
  demands: readonly unknown[];
  supportFronts: readonly { routines: readonly unknown[] }[];
};

export type ReportSummary = {
  deliveries: number;
  resolvedIncidents: number;
  newDemands: number;
  supportRoutines: number;
};

export function calculateReportSummary(input: ReportSummaryInput): ReportSummary {
  return {
    deliveries: input.deliveries.length,
    resolvedIncidents: input.incidents.filter((incident) => incident.status === "resolved").length,
    newDemands: input.demands.length,
    supportRoutines: input.supportFronts.reduce((total, front) => total + front.routines.length, 0),
  };
}

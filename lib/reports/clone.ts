export const cloneModes = ["empty", "in_progress", "support", "next_steps", "all_previous"] as const;

export type CloneMode = (typeof cloneModes)[number];

type Delivery = { status: string };
type Incident = { status: string };

export type CloneContent<TDelivery extends Delivery, TIncident extends Incident, TSupport, TSupportRoutine, TDependency, TNextStep, TDemand> = {
  deliveries: TDelivery[];
  incidents: TIncident[];
  demands: TDemand[];
  supportFronts: TSupport[];
  supportRoutines: TSupportRoutine[];
  dependencies: TDependency[];
  nextSteps: TNextStep[];
};

export function selectCloneContent<TDelivery extends Delivery, TIncident extends Incident, TSupport, TSupportRoutine, TDependency, TNextStep, TDemand>(
  mode: CloneMode,
  content: CloneContent<TDelivery, TIncident, TSupport, TSupportRoutine, TDependency, TNextStep, TDemand>,
): CloneContent<TDelivery, TIncident, TSupport, TSupportRoutine, TDependency, TNextStep, TDemand> {
  const empty = { deliveries: [], incidents: [], demands: [], supportFronts: [], supportRoutines: [], dependencies: [], nextSteps: [] };

  if (mode === "empty") return empty;
  if (mode === "in_progress") {
    return { ...empty, deliveries: content.deliveries.filter((item) => item.status !== "delivered"), incidents: content.incidents.filter((item) => item.status !== "resolved") };
  }
  if (mode === "support") return { ...empty, supportFronts: content.supportFronts, supportRoutines: content.supportRoutines };
  if (mode === "next_steps") return { ...empty, dependencies: content.dependencies, nextSteps: content.nextSteps };

  return {
    deliveries: content.deliveries.filter((item) => item.status !== "delivered"),
    incidents: content.incidents.filter((item) => item.status !== "resolved"),
    demands: content.demands,
    supportFronts: content.supportFronts,
    supportRoutines: content.supportRoutines,
    dependencies: content.dependencies,
    nextSteps: content.nextSteps,
  };
}

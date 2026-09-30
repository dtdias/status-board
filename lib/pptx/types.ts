export type DeliveryStatus = "delivered" | "in_progress" | "waiting_third_party" | "blocked";
export type IncidentStatus = "resolved" | "in_progress" | "waiting_third_party" | "blocked";
export type DemandPhase = "request_received" | "feasibility_requirements" | "development" | "validation";

export type PresentationInput = {
  report: {
    id: string;
    name: string;
    area: string;
    startDate: string;
    endDate: string;
    presentationDate: string;
    highlight: string;
  };
  deliveries: Array<{ id: string; title: string; description: string; status: DeliveryStatus; iconKey: string; position: number }>;
  incidents: Array<{ id: string; affectedSystem: string; symptom: string; cause: string | null; actionTaken: string; supportPeople: string | null; status: IncidentStatus; resolvedAt: string | null; iconKey: string; position: number }>;
  demands: Array<{ id: string; title: string; requesterName: string; requesterArea: string; involvedAreas: string[]; objective: string; statusText: string | null; currentPhase: DemandPhase; iconKey: string; position: number }>;
  supportFronts: Array<{ id: string; title: string; activityType: string; iconKey: string; position: number; routines: Array<{ id: string; title: string; position: number }> }>;
  dependencies: Array<{ id: string; title: string; description: string; owner: string; waitingSince: string; status: string | null; position: number }>;
  nextSteps: Array<{ id: string; title: string; description: string | null; owner: string | null; dueDate: string | null; position: number }>;
};

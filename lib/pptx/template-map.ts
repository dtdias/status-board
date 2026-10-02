export const TEMPLATE_SLIDES = {
  cover: 4,
  summary: 5,
  deliveries: 6,
  incidents: 7,
  demands: 8,
  support: 9,
  attention: 10,
} as const;

export const COVER_SHAPES = { area: "Text 0", title: "Text 1", week: "Text 2", footer: "Text 3" } as const;
export const SUMMARY_SHAPES = { footer: "Text 1", pageNumber: "Text 2", deliveryCount: "Text 4", incidentCount: "Text 7", demandCount: "Text 10", supportCount: "Text 13", highlight: "Text 16" } as const;
export const HEADER_SHAPES = { footer: "Text 1", pageNumber: "Text 2" } as const;

export const DELIVERY_CARDS = [
  { container: "Shape 3", icon: "Image 0", title: "Text 4", description: "Text 5", statusBackground: "Shape 6", statusText: "Text 7" },
  { container: "Shape 8", icon: "Image 1", title: "Text 9", description: "Text 10", statusBackground: "Shape 11", statusText: "Text 12" },
  { container: "Shape 13", icon: "Image 2", title: "Text 14", description: "Text 15", statusBackground: "Shape 16", statusText: "Text 17" },
  { container: "Shape 18", icon: "Image 3", title: "Text 19", description: "Text 20", statusBackground: "Shape 21", statusText: "Text 22" },
] as const;

export const INCIDENT_CARDS = [
  { container: "Shape 3", icon: "Image 0", title: "Text 4", body: "Text 5", statusBackground: "Shape 6", statusIcon: "Image 1", statusText: "Text 7" },
  { container: "Shape 8", icon: "Image 2", title: "Text 9", body: "Text 10", statusBackground: "Shape 11", statusIcon: "Image 3", statusText: "Text 12" },
] as const;

export const DEMAND_SHAPES = {
  card: "Shape 3",
  icon: "Image 0",
  demandTitle: "Text 4",
  demandBody: "Text 5",
  timelineLine: "Shape 6",
  phases: [
    { circle: "Shape 7", number: "Text 8", label: "Text 9" },
    { circle: "Shape 10", number: "Text 11", label: "Text 12" },
    { circle: "Shape 13", number: "Text 14", label: "Text 15" },
    { circle: "Shape 16", number: "Text 17", label: "Text 18" },
  ],
} as const;

export const SUPPORT_FRONTS = [
  { container: "Shape 3", icon: "Image 0", heading: "Text 4", routines: [{ container: "Shape 5", icon: "Image 1", text: "Text 6" }, { container: "Shape 7", icon: "Image 2", text: "Text 8" }, { container: "Shape 9", icon: "Image 3", text: "Text 10" }] },
  { container: "Shape 11", icon: "Image 4", heading: "Text 12", routines: [{ container: "Shape 13", icon: "Image 5", text: "Text 14" }, { container: "Shape 15", icon: "Image 6", text: "Text 16" }, { container: "Shape 17", icon: "Image 7", text: "Text 18" }] },
] as const;

export const ATTENTION_SHAPES = { dependencyContainer: "Shape 1", dependencyTitle: "Text 2", dependencyBody: "Text 3", nextStepsContainer: "Shape 4", nextStepsTitle: "Text 5", nextStepsBody: "Text 6", footer: "Text 7", pageNumber: "Text 8" } as const;

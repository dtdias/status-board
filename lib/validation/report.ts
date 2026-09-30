export const CONTENT_LIMITS = {
  deliveryTitle: 60,
  deliveryDescription: 150,
  incidentSystem: 60,
  incidentSymptom: 180,
  incidentCause: 150,
  incidentAction: 180,
  demandTitle: 60,
  demandObjective: 220,
  demandStatus: 100,
  supportFrontTitle: 50,
  supportActivityType: 80,
  supportRoutine: 90,
  dependencyTitle: 60,
  dependencyDescription: 160,
  nextStepTitle: 60,
  nextStepDescription: 160,
  highlight: 180,
} as const;

type ValidationSection = "report" | "delivery" | "incident" | "demand" | "support" | "dependency" | "next_step";

export type ValidationIssue = {
  code: string;
  section: ValidationSection;
  entityId?: string;
  field?: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

type ValidationItem = { id: string };

export type ReportValidationInput = {
  report: { startDate: string | null; endDate: string | null; presentationDate: string | null; highlight: string | null };
  deliveries: Array<ValidationItem & { title: string | null; description: string | null; status: string | null }>;
  incidents: Array<ValidationItem & { affectedSystem: string | null; symptom: string | null; cause: string | null; actionTaken: string | null; status: string | null; resolvedAt: string | null }>;
  demands: Array<ValidationItem & { title: string | null; requesterName: string | null; requesterArea: string | null; involvedAreas: string[] | null; objective: string | null; statusText: string | null; currentPhase: string | null }>;
  supportFronts: Array<ValidationItem & { title: string | null; activityType: string | null; routines: Array<ValidationItem & { title: string | null }> }>;
  dependencies: Array<ValidationItem & { title: string | null; description: string | null; owner: string | null; waitingSince: string | null }>;
  nextSteps: Array<ValidationItem & { title: string | null; description: string | null }>;
};

const warningThreshold = 0.8;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateLabels: Record<string, string> = {
  startDate: "a data inicial da semana",
  endDate: "a data final da semana",
  presentationDate: "a data da apresentação",
  resolvedAt: "a data de resolução",
  waitingSince: "a data inicial de espera",
};

function isBlank(value: string | null | undefined) {
  return !value?.trim();
}

function isIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return datePattern.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateDate(value: string | null, field: string, section: ValidationSection, errors: ValidationIssue[], entityId?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    errors.push({ code: "required", section, entityId, field, message: `Informe ${dateLabels[field] ?? field}.` });
  } else if (!isIsoDate(normalized)) {
    errors.push({ code: "invalid_date", section, entityId, field, message: `${dateLabels[field] ?? field} deve ser uma data válida.` });
  }
}

function validateText(value: string | null, field: string, label: string, limit: number, section: ValidationSection, errors: ValidationIssue[], warnings: ValidationIssue[], entityId?: string, required = true) {
  const normalized = value?.trim();
  if (required && !normalized) {
    errors.push({ code: "required", section, entityId, field, message: `Informe ${label}.` });
    return;
  }
  if (!normalized) return;

  const length = normalized.length;
  if (length > limit) {
    errors.push({ code: "content_limit_exceeded", section, entityId, field, message: `${label} deve ter no máximo ${limit} caracteres.` });
  } else if (length >= Math.ceil(limit * warningThreshold)) {
    warnings.push({ code: "content_limit_near", section, entityId, field, message: `${label} está próximo do limite visual de ${limit} caracteres.` });
  }
}

export function validateReport(input: ReportValidationInput): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const { report } = input;

  validateDate(report.startDate, "startDate", "report", errors);
  validateDate(report.endDate, "endDate", "report", errors);
  validateDate(report.presentationDate, "presentationDate", "report", errors);
  if (report.startDate && report.endDate && isIsoDate(report.startDate) && isIsoDate(report.endDate) && report.endDate < report.startDate) {
    errors.push({ code: "invalid_date_range", section: "report", field: "endDate", message: "A data final deve ser igual ou posterior à data inicial." });
  }
  validateText(report.highlight, "highlight", "o destaque da semana", CONTENT_LIMITS.highlight, "report", errors, warnings);

  for (const delivery of input.deliveries) {
    validateText(delivery.title, "title", "o título da entrega", CONTENT_LIMITS.deliveryTitle, "delivery", errors, warnings, delivery.id);
    validateText(delivery.description, "description", "a descrição da entrega", CONTENT_LIMITS.deliveryDescription, "delivery", errors, warnings, delivery.id);
    validateText(delivery.status, "status", "o status da entrega", Number.MAX_SAFE_INTEGER, "delivery", errors, warnings, delivery.id);
  }

  for (const incident of input.incidents) {
    validateText(incident.affectedSystem, "affectedSystem", "o sistema afetado", CONTENT_LIMITS.incidentSystem, "incident", errors, warnings, incident.id);
    validateText(incident.symptom, "symptom", "o sintoma", CONTENT_LIMITS.incidentSymptom, "incident", errors, warnings, incident.id);
    validateText(incident.cause, "cause", "a causa", CONTENT_LIMITS.incidentCause, "incident", errors, warnings, incident.id, false);
    validateText(incident.actionTaken, "actionTaken", "a ação tomada", CONTENT_LIMITS.incidentAction, "incident", errors, warnings, incident.id);
    validateText(incident.status, "status", "o status do incidente", Number.MAX_SAFE_INTEGER, "incident", errors, warnings, incident.id);
    if (incident.status === "resolved") validateDate(incident.resolvedAt, "resolvedAt", "incident", errors, incident.id);
  }

  for (const demand of input.demands) {
    validateText(demand.title, "title", "o título da demanda", CONTENT_LIMITS.demandTitle, "demand", errors, warnings, demand.id);
    validateText(demand.requesterName, "requesterName", "o solicitante da demanda", Number.MAX_SAFE_INTEGER, "demand", errors, warnings, demand.id);
    validateText(demand.requesterArea, "requesterArea", "a área solicitante", Number.MAX_SAFE_INTEGER, "demand", errors, warnings, demand.id);
    if (!demand.involvedAreas?.length || demand.involvedAreas.some((area) => isBlank(area))) errors.push({ code: "required", section: "demand", entityId: demand.id, field: "involvedAreas", message: "Informe as áreas envolvidas." });
    validateText(demand.objective, "objective", "o objetivo da demanda", CONTENT_LIMITS.demandObjective, "demand", errors, warnings, demand.id);
    validateText(demand.statusText, "statusText", "o status da demanda", CONTENT_LIMITS.demandStatus, "demand", errors, warnings, demand.id);
    validateText(demand.currentPhase, "currentPhase", "a fase atual da demanda", Number.MAX_SAFE_INTEGER, "demand", errors, warnings, demand.id);
  }

  for (const front of input.supportFronts) {
    validateText(front.title, "title", "o título da frente de sustentação", CONTENT_LIMITS.supportFrontTitle, "support", errors, warnings, front.id);
    validateText(front.activityType, "activityType", "o tipo de atividade", CONTENT_LIMITS.supportActivityType, "support", errors, warnings, front.id);
    if (front.routines.length > 3) errors.push({ code: "support_routine_limit_exceeded", section: "support", entityId: front.id, field: "routines", message: "Cada frente pode ter no máximo 3 rotinas." });
    for (const routine of front.routines) validateText(routine.title, "title", "a rotina de sustentação", CONTENT_LIMITS.supportRoutine, "support", errors, warnings, routine.id);
  }

  for (const dependency of input.dependencies) {
    validateText(dependency.title, "title", "o título da dependência", CONTENT_LIMITS.dependencyTitle, "dependency", errors, warnings, dependency.id);
    validateText(dependency.description, "description", "a descrição da dependência", CONTENT_LIMITS.dependencyDescription, "dependency", errors, warnings, dependency.id);
    validateText(dependency.owner, "owner", "o responsável da dependência", Number.MAX_SAFE_INTEGER, "dependency", errors, warnings, dependency.id);
    validateDate(dependency.waitingSince, "waitingSince", "dependency", errors, dependency.id);
  }

  for (const nextStep of input.nextSteps) {
    validateText(nextStep.title, "title", "o título do próximo passo", CONTENT_LIMITS.nextStepTitle, "next_step", errors, warnings, nextStep.id);
    validateText(nextStep.description, "description", "a descrição do próximo passo", CONTENT_LIMITS.nextStepDescription, "next_step", errors, warnings, nextStep.id, false);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export const ONBOARDING_TOUR_VERSION = 1;

export type TourCompletion = "manual" | "link" | "submit";

export type TourStep = {
  id: string;
  target: string;
  fallbackTarget?: string;
  title: string;
  description: string;
  completion?: TourCompletion;
  nextLabel?: string;
};

export type MainTourStep = TourStep & { route: "dashboard" | "new-report" | "report" };
export type FormTourId = "delivery" | "incident" | "demand" | "support-front" | "support-routine" | "dependency" | "next-step";
export type FormTour = { id: FormTourId; matches: (pathname: string) => boolean; steps: TourStep[] };

export const onboardingTourSteps: MainTourStep[] = [
  { id: "new-week", route: "dashboard", target: '[data-tour="new-week"]', title: "Comece uma semana", description: "Crie um relatório semanal para registrar entregas, incidentes, demandas, sustentação e pontos de atenção.", completion: "link", nextLabel: "Abrir Nova semana" },
  { id: "start-date", route: "new-report", target: '[data-tour="start-date"]', title: "Data inicial", description: "Informe o primeiro dia da semana que será registrada." },
  { id: "end-date", route: "new-report", target: '[data-tour="end-date"]', title: "Data final", description: "Informe o último dia do período. O sistema usa este intervalo para organizar a semana." },
  { id: "presentation-date", route: "new-report", target: '[data-tour="presentation-date"]', title: "Data da apresentação", description: "Escolha a data em que o status será apresentado ao time." },
  { id: "highlight", route: "new-report", target: '[data-tour="highlight"]', title: "Destaque da semana", description: "Escreva o principal resumo da semana. Este texto aparece na capa e tem limite de 180 caracteres." },
  { id: "clone-mode", route: "new-report", target: '[data-tour="clone-options"]', title: "Escolha o ponto de partida", description: "Vazia começa do zero. As outras opções reaproveitam itens da semana anterior. No primeiro relatório, mantenha Vazia." },
  { id: "create-week", route: "new-report", target: '[data-tour="create-week"]', title: "Crie o relatório", description: "Preencha os campos e use este botão para salvar a semana e abrir o board. O botão real continua disponível para você clicar.", completion: "submit" },
  { id: "board-overview", route: "report", target: '[data-tour="board-overview"]', title: "Seu board semanal", description: "Aqui você organiza a semana por tipo de informação. Cada coluna alimenta uma parte diferente do status." },
  { id: "board-deliveries", route: "report", target: '[data-tour="board-deliveries"]', title: "Entregas", description: "Registre o que foi entregue, seu status e ícone. Entregas podem ser reordenadas no board." },
  { id: "board-incidents", route: "report", target: '[data-tour="board-incidents"]', title: "Incidentes", description: "Documente o que ocorreu, causa, ação tomada, suporte, status e resolução." },
  { id: "board-demands", route: "report", target: '[data-tour="board-demands"]', title: "Demandas", description: "Registre solicitações, áreas envolvidas, objetivo, status e fase atual." },
  { id: "board-support", route: "report", target: '[data-tour="board-support"]', title: "Sustentação", description: "Organize frentes recorrentes e suas rotinas. Cada frente aceita até três rotinas." },
  { id: "board-dependencies", route: "report", target: '[data-tour="board-dependencies"]', title: "Dependências", description: "Use para registrar o que está bloqueando o trabalho. Responsável e data de espera são obrigatórios." },
  { id: "board-next-steps", route: "report", target: '[data-tour="board-next-steps"]', title: "Próximos passos", description: "Registre ações futuras, responsáveis e prazos quando existirem." },
  { id: "edit-highlight", route: "report", target: '[data-tour="edit-highlight"]', title: "Edite o destaque", description: "O destaque resume a semana e aparece na apresentação. Use este botão para ajustar o texto." },
  { id: "preview", route: "report", target: '[data-tour="preview"]', title: "Veja uma prévia", description: "Pré-visualizar mostra como o PowerPoint ficará sem criar uma versão final no histórico." },
  { id: "mark-ready", route: "report", target: '[data-tour="report-status"]', title: "Valide o conteúdo", description: "Marcar como pronto valida os campos obrigatórios antes da geração." },
  { id: "generate-pptx", route: "report", target: '[data-tour="generate-pptx"]', fallbackTarget: '[data-tour="report-status"]', title: "Gere o PowerPoint", description: "Depois da validação, Gerar PowerPoint cria o arquivo final com o template corporativo.", nextLabel: "Concluir tutorial" },
];

const common = {
  delivery: { matches: (path: string) => /\/deliveries\/new$/.test(path), steps: [
    ["delivery-title", "Nome da entrega", "Dê um nome curto para o que foi entregue.", '[data-tour="form-delivery-title"]'],
    ["delivery-description", "Descrição", "Explique o resultado e o contexto da entrega.", '[data-tour="form-delivery-description"]'],
    ["delivery-status", "Status", "Indique se está entregue, em andamento, aguardando terceiro ou bloqueado.", '[data-tour="form-delivery-status"]'],
    ["delivery-icon", "Ícone", "Escolha um ícone que ajude a reconhecer o tipo da entrega.", '[data-tour="form-delivery-icon"]'],
    ["delivery-submit", "Salvar entrega", "Use este botão quando terminar. A entrega será adicionada ao board.", '[data-tour="form-delivery-submit"]'],
  ]},
  incident: { matches: (path: string) => /\/incidents\/new$/.test(path), steps: [
    ["incident-system", "Sistema afetado", "Informe qual sistema ou serviço foi afetado.", '[data-tour="form-incident-system"]'],
    ["incident-symptom", "O que aconteceu", "Descreva o sintoma observado.", '[data-tour="form-incident-symptom"]'],
    ["incident-cause", "Causa", "Registre a causa quando ela for conhecida.", '[data-tour="form-incident-cause"]'],
    ["incident-action", "Ação tomada", "Explique como o incidente foi tratado.", '[data-tour="form-incident-action"]'],
    ["incident-support", "Pessoas de suporte", "Liste quem apoiou o atendimento, se aplicável.", '[data-tour="form-incident-support"]'],
    ["incident-status", "Status e resolução", "Escolha o status e informe a data de resolução quando resolvido.", '[data-tour="form-incident-status"]'],
    ["incident-icon", "Ícone", "Escolha um ícone para representar o incidente.", '[data-tour="form-incident-icon"]'],
    ["incident-submit", "Salvar incidente", "Use este botão para adicionar o incidente ao board.", '[data-tour="form-incident-submit"]'],
  ]},
  demand: { matches: (path: string) => /\/demands\/new$/.test(path), steps: [
    ["demand-title", "Título", "Dê um nome claro para a demanda.", '[data-tour="form-demand-title"]'],
    ["demand-requester", "Solicitante", "Informe quem solicitou a demanda.", '[data-tour="form-demand-requester"]'],
    ["demand-area", "Área solicitante", "Informe de qual área veio a solicitação.", '[data-tour="form-demand-area"]'],
    ["demand-involved", "Áreas envolvidas", "Liste áreas envolvidas separando os nomes por vírgula.", '[data-tour="form-demand-involved"]'],
    ["demand-objective", "Objetivo", "Explique o resultado esperado.", '[data-tour="form-demand-objective"]'],
    ["demand-status", "Status", "Use este campo para resumir o estado atual da demanda.", '[data-tour="form-demand-status"]'],
    ["demand-phase", "Fase", "Selecione a fase atual do trabalho.", '[data-tour="form-demand-phase"]'],
    ["demand-submit", "Salvar demanda", "Use este botão para adicionar a demanda ao board.", '[data-tour="form-demand-submit"]'],
  ]},
  "support-front": { matches: (path: string) => /\/support-fronts\/new$/.test(path), steps: [
    ["support-title", "Nome da frente", "Dê um nome para a frente recorrente.", '[data-tour="form-support-title"]'],
    ["support-activity", "Tipo da atividade", "Explique que tipo de atividade a frente representa.", '[data-tour="form-support-activity"]'],
    ["support-icon", "Ícone", "Escolha um ícone para identificar a frente.", '[data-tour="form-support-icon"]'],
    ["support-submit", "Salvar frente", "Depois de salvar, você poderá adicionar rotinas.", '[data-tour="form-support-submit"]'],
  ]},
  "support-routine": { matches: (path: string) => /\/support-fronts\/[^/]+$/.test(path), steps: [
    ["routine-title", "Nova rotina", "Descreva uma rotina desta frente. Cada frente aceita até três.", '[data-tour="form-routine-title"]'],
    ["routine-submit", "Adicionar rotina", "Use este botão para salvar a rotina na frente.", '[data-tour="form-routine-submit"]'],
  ]},
  dependency: { matches: (path: string) => /\/attention\/dependencies\/new$/.test(path), steps: [
    ["dependency-title", "Título", "Dê um nome para o bloqueio.", '[data-tour="form-dependency-title"]'],
    ["dependency-description", "Descrição", "Explique o que precisa ser destravado.", '[data-tour="form-dependency-description"]'],
    ["dependency-owner", "Responsável", "Informe quem acompanha esta dependência.", '[data-tour="form-dependency-owner"]'],
    ["dependency-date", "Aguardando desde", "Informe desde quando o item está aguardando.", '[data-tour="form-dependency-date"]'],
    ["dependency-status", "Status", "Registre um status adicional, se necessário.", '[data-tour="form-dependency-status"]'],
    ["dependency-display", "Exibição no PowerPoint", "Escolha quais dados devem aparecer no slide.", '[data-tour="form-dependency-display"]'],
    ["dependency-submit", "Salvar dependência", "Use este botão para adicionar o bloqueio ao board.", '[data-tour="form-dependency-submit"]'],
  ]},
  "next-step": { matches: (path: string) => /\/attention\/next-steps\/new$/.test(path), steps: [
    ["next-title", "Título", "Dê um nome para a próxima ação.", '[data-tour="form-next-title"]'],
    ["next-description", "Descrição", "Explique o que precisa acontecer.", '[data-tour="form-next-description"]'],
    ["next-owner", "Responsável", "Informe quem executará a ação, se houver.", '[data-tour="form-next-owner"]'],
    ["next-date", "Prazo", "Defina um prazo quando existir.", '[data-tour="form-next-date"]'],
    ["next-display", "Exibição no PowerPoint", "Escolha quais dados devem aparecer no slide.", '[data-tour="form-next-display"]'],
    ["next-submit", "Salvar próximo passo", "Use este botão para adicionar a ação ao board.", '[data-tour="form-next-submit"]'],
  ]},
} as const;

export const formTours: FormTour[] = Object.entries(common).map(([id, definition]) => ({
  id: id as FormTourId,
  matches: definition.matches,
  steps: definition.steps.map(([stepId, title, description, target], index) => ({ id: stepId, title, description, target, nextLabel: index === definition.steps.length - 1 ? "Fechar ajuda" : undefined })),
}));

export function formTourForPath(pathname: string) {
  return formTours.find((tour) => tour.matches(pathname));
}

export function tourRouteMatches(route: MainTourStep["route"], pathname: string) {
  if (route === "dashboard") return pathname === "/app";
  if (route === "new-report") return pathname === "/app/reports/new";
  return pathname !== "/app/reports/new" && /^\/app\/reports\/[^/]+$/.test(pathname);
}

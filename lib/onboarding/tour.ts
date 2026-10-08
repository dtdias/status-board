export const ONBOARDING_TOUR_VERSION = 1;

export type TourStep = {
  id: string;
  route: "dashboard" | "new-report" | "report";
  target: string;
  fallbackTarget?: string;
  title: string;
  description: string;
  nextLabel?: string;
  advancesByNavigation?: boolean;
  navigationAction?: "link" | "submit";
};

export const onboardingTourSteps: TourStep[] = [
  { id: "new-week", route: "dashboard", target: '[data-tour="new-week"]', title: "Comece uma semana", description: "Crie um relatório semanal para registrar entregas, incidentes, demandas, sustentação e pontos de atenção.", nextLabel: "Abrir Nova semana", advancesByNavigation: true, navigationAction: "link" },
  { id: "start-date", route: "new-report", target: '[data-tour="start-date"]', title: "Data inicial", description: "Informe o primeiro dia da semana que será registrada." },
  { id: "end-date", route: "new-report", target: '[data-tour="end-date"]', title: "Data final", description: "Informe o último dia do período. O sistema usa este intervalo para organizar a semana." },
  { id: "presentation-date", route: "new-report", target: '[data-tour="presentation-date"]', title: "Data da apresentação", description: "Escolha a data em que o status será apresentado ao time." },
  { id: "highlight", route: "new-report", target: '[data-tour="highlight"]', title: "Destaque da semana", description: "Escreva o principal resumo da semana. Este texto aparece na capa e tem limite de 180 caracteres." },
  { id: "clone-mode", route: "new-report", target: '[data-tour="clone-options"]', title: "Escolha o ponto de partida", description: "Vazia começa do zero. As outras opções reaproveitam itens da semana anterior. No primeiro relatório, mantenha Vazia." },
  { id: "create-week", route: "new-report", target: '[data-tour="create-week"]', title: "Crie o relatório", description: "Preencha as datas e o destaque da semana. Depois, use este botão para salvar a semana e abrir o board para edição.", nextLabel: "Focar Criar semana", advancesByNavigation: true, navigationAction: "submit" },
  { id: "add-delivery", route: "report", target: '[data-tour="add-delivery"]', title: "Preencha o board", description: "Use Adicionar em cada coluna para registrar os itens. Clique em um card depois para editar. Entregas também podem ser reordenadas." },
  { id: "edit-highlight", route: "report", target: '[data-tour="edit-highlight"]', title: "Edite o destaque", description: "O destaque resume a semana e aparece na apresentação. Use este botão para ajustar o texto antes de gerar o PowerPoint." },
  { id: "preview", route: "report", target: '[data-tour="preview"]', title: "Veja uma prévia", description: "Pré-visualizar mostra como o PowerPoint ficará sem criar uma versão final no histórico." },
  { id: "mark-ready", route: "report", target: '[data-tour="report-status"]', title: "Valide o conteúdo", description: "Marcar como pronto valida os campos obrigatórios. Corrija os itens pendentes antes de gerar a apresentação." },
  { id: "generate-pptx", route: "report", target: '[data-tour="generate-pptx"]', fallbackTarget: '[data-tour="report-status"]', title: "Gere o PowerPoint", description: "Depois da validação, Gerar PowerPoint cria o arquivo final usando o template corporativo. O botão aparece quando o relatório está pronto.", nextLabel: "Concluir tutorial" },
];

export function tourRouteMatches(route: TourStep["route"], pathname: string) {
  if (route === "dashboard") return pathname === "/app";
  if (route === "new-report") return pathname === "/app/reports/new";
  return /^\/app\/reports\/[^/]+$/.test(pathname);
}

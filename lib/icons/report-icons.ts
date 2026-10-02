export const reportIconCatalog = [
  { key: "rpa", label: "RPA", group: "Automação e sistemas", slide: 2, shape: "Image 0" },
  { key: "process", label: "Processo", group: "Automação e sistemas", slide: 2, shape: "Image 1" },
  { key: "routine", label: "Rotina", group: "Automação e sistemas", slide: 2, shape: "Image 2" },
  { key: "trigger", label: "Gatilho", group: "Automação e sistemas", slide: 2, shape: "Image 3" },
  { key: "code", label: "Código", group: "Automação e sistemas", slide: 2, shape: "Image 4" },
  { key: "script", label: "Script", group: "Automação e sistemas", slide: 2, shape: "Image 5" },
  { key: "flow", label: "Fluxo", group: "Automação e sistemas", slide: 2, shape: "Image 6" },
  { key: "integration", label: "Integração", group: "Automação e sistemas", slide: 2, shape: "Image 7" },
  { key: "bars", label: "Barras", group: "Dados e BI", slide: 2, shape: "Image 8" },
  { key: "trend", label: "Tendência", group: "Dados e BI", slide: 2, shape: "Image 9" },
  { key: "bi", label: "BI", group: "Dados e BI", slide: 2, shape: "Image 10" },
  { key: "table", label: "Tabela", group: "Dados e BI", slide: 2, shape: "Image 11" },
  { key: "spreadsheet", label: "Planilha", group: "Dados e BI", slide: 2, shape: "Image 12" },
  { key: "pdf", label: "PDF", group: "Dados e BI", slide: 2, shape: "Image 13" },
  { key: "report", label: "Relatório", group: "Dados e BI", slide: 2, shape: "Image 14" },
  { key: "analysis", label: "Análise", group: "Dados e BI", slide: 2, shape: "Image 15" },
  { key: "server", label: "Servidor", group: "Infra e comunicação", slide: 2, shape: "Image 16" },
  { key: "database", label: "Banco de dados", group: "Infra e comunicação", slide: 2, shape: "Image 17" },
  { key: "cloud", label: "Nuvem", group: "Infra e comunicação", slide: 2, shape: "Image 18" },
  { key: "network", label: "Rede", group: "Infra e comunicação", slide: 2, shape: "Image 19" },
  { key: "security", label: "Segurança", group: "Infra e comunicação", slide: 2, shape: "Image 20" },
  { key: "access", label: "Acesso", group: "Infra e comunicação", slide: 2, shape: "Image 21" },
  { key: "email", label: "E-mail", group: "Infra e comunicação", slide: 2, shape: "Image 22" },
  { key: "notification", label: "Notificação", group: "Infra e comunicação", slide: 2, shape: "Image 23" },
  { key: "orders", label: "Pedidos", group: "Áreas e negócio", slide: 3, shape: "Image 0" },
  { key: "logistics", label: "Logística", group: "Áreas e negócio", slide: 3, shape: "Image 1" },
  { key: "inventory", label: "Estoque", group: "Áreas e negócio", slide: 3, shape: "Image 2" },
  { key: "production", label: "Produção", group: "Áreas e negócio", slide: 3, shape: "Image 3" },
  { key: "banking", label: "Bancário", group: "Áreas e negócio", slide: 3, shape: "Image 4" },
  { key: "finance", label: "Financeiro", group: "Áreas e negócio", slide: 3, shape: "Image 5" },
  { key: "commercial", label: "Comercial", group: "Áreas e negócio", slide: 3, shape: "Image 6" },
  { key: "team", label: "Equipe", group: "Áreas e negócio", slide: 3, shape: "Image 7" },
  { key: "demand", label: "Demanda", group: "Gestão e projetos", slide: 3, shape: "Image 8" },
  { key: "tasks", label: "Tarefas", group: "Gestão e projetos", slide: 3, shape: "Image 9" },
  { key: "deadline", label: "Prazo", group: "Gestão e projetos", slide: 3, shape: "Image 10" },
  { key: "waiting", label: "Aguardando", group: "Gestão e projetos", slide: 3, shape: "Image 11" },
  { key: "completed", label: "Concluído", group: "Gestão e projetos", slide: 3, shape: "Image 12" },
  { key: "go_live", label: "Go-live", group: "Gestão e projetos", slide: 3, shape: "Image 13" },
  { key: "idea", label: "Ideia", group: "Gestão e projetos", slide: 3, shape: "Image 14" },
  { key: "milestone", label: "Marco", group: "Gestão e projetos", slide: 3, shape: "Image 15" },
  { key: "incident", label: "Incidente", group: "Incidentes e alertas", slide: 3, shape: "Image 16" },
  { key: "attention", label: "Atenção", group: "Incidentes e alertas", slide: 3, shape: "Image 17" },
  { key: "bug", label: "Bug", group: "Incidentes e alertas", slide: 3, shape: "Image 18" },
  { key: "failure", label: "Falha", group: "Incidentes e alertas", slide: 3, shape: "Image 19" },
  { key: "blocked", label: "Bloqueado", group: "Incidentes e alertas", slide: 3, shape: "Image 20" },
  { key: "critical", label: "Crítico", group: "Incidentes e alertas", slide: 3, shape: "Image 21" },
  { key: "disconnection", label: "Desconexão", group: "Incidentes e alertas", slide: 3, shape: "Image 22" },
  { key: "fix", label: "Correção", group: "Incidentes e alertas", slide: 3, shape: "Image 23" },
] as const;

export type ReportIconKey = (typeof reportIconCatalog)[number]["key"];
export type ReportIconDefinition = (typeof reportIconCatalog)[number];
export const reportIconKeys = reportIconCatalog.map((icon) => icon.key) as [ReportIconKey, ...ReportIconKey[]];

const reportIconByKey = new Map<string, ReportIconDefinition>(reportIconCatalog.map((icon) => [icon.key, icon]));

export function getReportIcon(iconKey: string) {
  return reportIconByKey.get(iconKey);
}

export function isReportIconKey(iconKey: unknown): iconKey is ReportIconKey {
  return typeof iconKey === "string" && reportIconByKey.has(iconKey);
}

export function reportIconPath(iconKey: ReportIconKey) {
  return `/report-icons/${iconKey}.png`;
}

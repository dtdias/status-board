const ICONS_1 = ["rpa", "process", "routine", "trigger", "code", "script", "flow", "integration", "bars", "trend", "bi", "table", "spreadsheet", "pdf", "report", "analysis", "server", "database", "cloud", "network", "security", "access", "email", "notification"] as const;
const ICONS_2 = ["orders", "logistics", "inventory", "production", "banking", "finance", "commercial", "team", "demand", "tasks", "deadline", "waiting", "completed", "go_live", "idea", "milestone", "incident", "attention", "bug", "failure", "blocked", "critical", "disconnection", "fix"] as const;

export function iconSource(iconKey: string): { slide: number; name: string } | null {
  const firstIndex = ICONS_1.indexOf(iconKey as (typeof ICONS_1)[number]);
  if (firstIndex >= 0) return { slide: 2, name: `Image ${firstIndex}` };
  const secondIndex = ICONS_2.indexOf(iconKey as (typeof ICONS_2)[number]);
  if (secondIndex >= 0) return { slide: 3, name: `Image ${secondIndex}` };
  return null;
}

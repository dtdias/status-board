import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const actions = readFileSync(resolve(root, "app/app/actions.ts"), "utf8");
const layout = readFileSync(resolve(root, "app/app/layout.tsx"), "utf8");
const toolbar = readFileSync(resolve(root, "components/navigation/sign-out-button.tsx"), "utf8");
const backLink = readFileSync(resolve(root, "components/navigation/back-link.tsx"), "utf8");

describe("authenticated navigation", () => {
  it("signs out only the current session and routes failures visibly", () => {
    expect(actions).toContain('signOut({ scope: "local" })');
    expect(actions).toContain('redirect("/login" as Route)');
    expect(actions).toContain("Não foi possível sair.");
    expect(toolbar).toContain('"Saindo…"');
    expect(toolbar).toContain('role="alert"');
  });

  it("protects every app route and exposes global account controls", () => {
    expect(layout).toContain('redirect("/login" as Route)');
    expect(layout).toContain("<AccountToolbar />");
    expect(backLink).toContain("className=\"outline-button back-link\"");
  });

  it("provides fixed back destinations for report creation and demand creation", () => {
    const reportCreate = readFileSync(resolve(root, "app/app/reports/new/page.tsx"), "utf8");
    const demandCreate = readFileSync(resolve(root, "app/app/reports/[reportId]/demands/new/page.tsx"), "utf8");
    const reportBoard = readFileSync(resolve(root, "app/app/reports/[reportId]/page.tsx"), "utf8");
    expect(reportCreate).toContain('label="Voltar às semanas"');
    expect(demandCreate).toContain('label="Voltar ao board"');
    expect(reportBoard).toContain('label="Voltar às semanas"');
  });
});

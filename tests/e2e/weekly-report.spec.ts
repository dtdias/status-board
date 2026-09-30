import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_RUN === "true"
  && Boolean(process.env.E2E_BASE_URL)
  && Boolean(process.env.E2E_USER_EMAIL)
  && Boolean(process.env.E2E_USER_PASSWORD);

function reportDates() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 14);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const presentation = new Date(end);
  presentation.setUTCDate(presentation.getUTCDate() + 2);
  const iso = (date: Date) => date.toISOString().slice(0, 10);

  return { start: iso(start), end: iso(end), presentation: iso(presentation) };
}

test.describe("weekly report PRD flow", () => {
  test.skip(!enabled, "Set E2E_RUN=true, E2E_BASE_URL, E2E_USER_EMAIL, and E2E_USER_PASSWORD to run against an isolated Supabase environment.");

  test("logs in, creates a week, adds delivery and incident, updates details, then validates", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel("Senha").fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app$/);

    await page.getByRole("link", { name: "Nova semana" }).click();
    const dates = reportDates();
    await page.getByLabel("Data inicial").fill(dates.start);
    await page.getByLabel("Data final").fill(dates.end);
    await page.getByLabel("Data da apresentação").fill(dates.presentation);
    await page.getByRole("button", { name: "Criar semana" }).click();
    await page.waitForURL(/\/app\/reports\/[^/]+$/);

    const reportId = new URL(page.url()).pathname.split("/").at(-1)!;
    await page.getByRole("link", { name: "Adicionar entrega" }).click();
    await page.getByLabel("Nome da entrega").fill("Entrega E2E");
    await page.getByLabel("Descrição").fill("Entrega criada pelo fluxo E2E.");
    await page.getByLabel("Status").selectOption("delivered");
    await page.getByRole("button", { name: "Salvar entrega" }).click();
    await expect(page.getByText("Entrega E2E", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Adicionar incidente" }).click();
    await page.getByLabel("Sistema afetado").fill("Sistema E2E");
    await page.getByLabel("O que aconteceu").fill("Incidente criado pelo fluxo E2E.");
    await page.getByLabel("Ação tomada").fill("Incidente resolvido durante o teste.");
    await page.getByLabel("Data de resolução").fill(dates.end);
    await page.getByRole("button", { name: "Salvar incidente" }).click();
    await expect(page.getByText("Sistema E2E", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Editar detalhes" }).click();
    await page.getByLabel("Destaque da semana").fill("Entrega E2E publicada com sucesso.");
    await page.getByRole("button", { name: "Salvar detalhes" }).click();
    await expect(page.getByText("Entrega E2E", { exact: true })).toBeVisible();

    const validation = await page.request.post(`/api/reports/${reportId}/validate`);
    expect(validation.status()).toBe(200);
    const result = await validation.json() as { valid: boolean };
    expect(result.valid).toBe(true);
  });

  test.fixme("generates a PPTX and lists it in history", async () => {
    // Activate when the generator fixture and storage environment are available.
  });
});

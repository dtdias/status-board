import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_RUN === "true"
  && Boolean(process.env.E2E_BASE_URL)
  && Boolean(process.env.E2E_USER_EMAIL)
  && Boolean(process.env.E2E_USER_PASSWORD);

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});

function reportDates() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 21);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const presentation = new Date(end);
  presentation.setUTCDate(presentation.getUTCDate() + 2);
  const iso = (date: Date) => date.toISOString().slice(0, 10);

  return { start: iso(start), end: iso(end), presentation: iso(presentation) };
}

test.describe("mobile report board", () => {
  test.skip(!enabled, "Set E2E_RUN=true, E2E_BASE_URL, E2E_USER_EMAIL, and E2E_USER_PASSWORD to run mobile checks.");

  test("switches board categories and exposes touch-safe reorder controls", async ({ page }) => {
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
    await page.getByLabel("Destaque da semana").fill("Board mobile E2E.");
    await page.getByRole("button", { name: "Criar semana" }).click();
    await expect(page).toHaveURL(/\/app\/reports\/[^/]+$/);

    await expect(page.getByRole("tablist", { name: "Categorias do board" })).toBeVisible();
    await page.getByRole("tab", { name: "Incidentes" }).click();
    await expect(page.getByRole("tab", { name: "Incidentes" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#report-board-panel-incidents")).toBeVisible();
    await expect(page.locator("#report-board-panel-deliveries")).toBeHidden();

    await page.getByRole("tab", { name: "Entregas" }).click();
    await page.getByRole("link", { name: "Adicionar entrega" }).click();
    await page.getByLabel("Nome da entrega").fill("Entrega mobile um");
    await page.getByLabel("Descrição").fill("Primeira entrega mobile.");
    await page.getByLabel("Status").selectOption("delivered");
    await page.getByRole("button", { name: "Salvar entrega" }).click();
    await expect(page.getByText("Entrega mobile um", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Adicionar entrega" }).click();
    await page.getByLabel("Nome da entrega").fill("Entrega mobile dois");
    await page.getByLabel("Descrição").fill("Segunda entrega mobile.");
    await page.getByLabel("Status").selectOption("in_progress");
    await page.getByRole("button", { name: "Salvar entrega" }).click();
    await expect(page.getByText("Entrega mobile dois", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Mover Entrega mobile um para cima" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Mover Entrega mobile um para baixo" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Mover Entrega mobile dois para cima" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Mover Entrega mobile dois para baixo" })).toBeDisabled();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

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

  test("creates, validates, generates, and downloads a weekly report presentation", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel("Senha").fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app$/);

    await page.getByRole("link", { name: "Nova semana" }).click();
    await expect(page.getByRole("link", { name: "Voltar às semanas" })).toBeVisible();
    await page.getByRole("link", { name: "Voltar às semanas" }).click();
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
    await expect(page.getByRole("link", { name: "Adicionar entrega" })).toBeVisible();

    await page.getByRole("link", { name: "Adicionar entrega" }).click();
    await page.getByLabel("Nome da entrega").fill("Segunda entrega E2E");
    await page.getByLabel("Descrição").fill("Segunda entrega criada pelo fluxo E2E.");
    await page.getByLabel("Status").selectOption("in_progress");
    await page.getByRole("button", { name: "Salvar entrega" }).click();
    await expect(page.getByText("Segunda entrega E2E", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Adicionar entrega" })).toBeVisible();

    await page.getByRole("link", { name: "Adicionar incidente" }).click();
    await page.getByLabel("Sistema afetado").fill("Sistema E2E");
    await page.getByLabel("O que aconteceu").fill("Incidente criado pelo fluxo E2E.");
    await page.getByLabel("Ação tomada").fill("Incidente resolvido durante o teste.");
    await page.getByLabel("Data de resolução").fill(dates.end);
    await page.getByRole("button", { name: "Salvar incidente" }).click();
    await expect(page.getByText("Sistema E2E", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Adicionar incidente" })).toBeVisible();

    await page.getByRole("link", { name: "Adicionar incidente" }).click();
    await page.getByLabel("Sistema afetado").fill("Segundo sistema E2E");
    await page.getByLabel("O que aconteceu").fill("Segundo incidente criado pelo fluxo E2E.");
    await page.getByLabel("Ação tomada").fill("Segundo incidente resolvido no teste.");
    await page.getByLabel("Data de resolução").fill(dates.end);
    await page.getByRole("button", { name: "Salvar incidente" }).click();
    await expect(page.getByText("Segundo sistema E2E", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Adicionar incidente" })).toBeVisible();

    await page.getByRole("link", { name: "Editar detalhes" }).click();
    await page.getByLabel("Destaque da semana").fill("Entrega E2E publicada com sucesso.");
    await page.getByRole("button", { name: "Salvar detalhes" }).click();
    await expect(page.getByText("Entrega E2E", { exact: true })).toBeVisible();

    const validation = await page.request.post(`/api/reports/${reportId}/validate`);
    expect(validation.status()).toBe(200);
    const result = await validation.json() as { valid: boolean; errors: unknown[] };
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    await Promise.all([
      page.waitForURL(new RegExp(`/app/reports/${reportId}$`)),
      page.getByRole("button", { name: "Marcar como pronto" }).click(),
    ]);
    await expect(page.getByText("Status: Pronto para gerar", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Pré-visualizar" }).click();
    await expect(page).toHaveURL(new RegExp(`/app/reports/${reportId}/preview$`));
    await expect(page.getByRole("status")).toContainText("PPTX carregado. 7 slides.");
    const previewHistory = await page.request.get(`/api/reports/${reportId}/presentations`);
    expect(previewHistory.status()).toBe(200);
    expect((await previewHistory.json() as { presentations: unknown[] }).presentations).toEqual([]);
    await page.getByRole("link", { name: "Voltar ao board" }).click();
    await expect(page).toHaveURL(new RegExp(`/app/reports/${reportId}$`));

    const generatedResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && new URL(response.url()).pathname === `/api/reports/${reportId}/generate-pptx`,
    );
    await page.getByRole("button", { name: "Gerar PowerPoint" }).click();
    const generatedResponse = await generatedResponsePromise;
    expect(generatedResponse.status()).toBe(200);
    const generated = await generatedResponse.json() as {
      presentation: { id: string; version: number; fileName: string; downloadUrl: string };
    };
    expect(generated.presentation).toMatchObject({ version: 1 });

    await expect(page.getByRole("link", { name: "PowerPoint pronto. Baixar arquivo." })).toHaveAttribute("href", generated.presentation.downloadUrl);
    await expect(page.getByRole("link", { name: "Baixar PowerPoint" })).toHaveAttribute("href", generated.presentation.downloadUrl);

    await Promise.all([
      page.waitForURL(new RegExp(`/app/reports/${reportId}/presentations/${generated.presentation.id}/preview$`)),
      page.getByRole("link", { name: "Visualizar PowerPoint" }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "PowerPoint — versão 1" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("PPTX carregado.");
    await expect(page.getByText("arquivo não é enviado a serviço externo.")).toBeVisible();

    const history = await page.request.get(`/api/reports/${reportId}/presentations`);
    expect(history.status()).toBe(200);
    const historyResult = await history.json() as {
      presentations: Array<{ id: string; version: number; fileName: string; downloadUrl: string }>;
    };
    expect(historyResult.presentations).toEqual([expect.objectContaining(generated.presentation)]);

    const download = await page.request.get(generated.presentation.downloadUrl);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toContain("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(download.headers()["content-disposition"]).toContain("attachment;");
    const pptx = await download.body();
    expect([...pptx.subarray(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });
});

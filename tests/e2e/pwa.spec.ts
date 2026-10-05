import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_RUN === "true" && Boolean(process.env.E2E_BASE_URL);

test.describe("PWA contract", () => {
  test.skip(!enabled, "Set E2E_RUN=true and E2E_BASE_URL to run PWA checks against a production-like deployment.");

  test("serves manifest, worker and install icons", async ({ request }) => {
    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const manifest = await manifestResponse.json();
    expect(manifest.start_url).toBe("/app");
    expect(manifest.display).toBe("standalone");

    const workerResponse = await request.get("/sw.js");
    expect(workerResponse.ok()).toBe(true);
    expect(workerResponse.headers()["cache-control"]).toContain("no-cache");

    for (const icon of ["/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png"]) {
      const response = await request.get(icon);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  });

  test("offers a custom Chromium installation action", async ({ page }) => {
    await page.addInitScript(() => {
      window.setTimeout(() => {
        const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: "accepted"; platform: string }>;
        };
        event.prompt = async () => {
          (window as Window & { statusBoardInstallPromptCalled?: boolean }).statusBoardInstallPromptCalled = true;
        };
        event.userChoice = Promise.resolve({ outcome: "accepted", platform: "test" });
        window.dispatchEvent(event);
      }, 500);
    });

    await page.goto("/login");
    const installButton = page.getByRole("button", { name: "Instalar app" });
    await expect(installButton).toBeVisible();
    await installButton.click();
    await expect(installButton).toBeHidden();
    await expect.poll(() => page.evaluate(() => Boolean((window as Window & { statusBoardInstallPromptCalled?: boolean }).statusBoardInstallPromptCalled))).toBe(true);
  });

  test("shows iOS installation instructions", async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    await page.goto("/login");
    await expect(page.getByText("Adicionar à Tela de Início")).toBeVisible();

    await context.close();
  });

  test("shows public offline fallback without caching private routes", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

    await page.context().setOffline(true);
    try {
      await page.goto("/app", { waitUntil: "domcontentloaded" }).catch(() => undefined);
      await expect(page.getByRole("heading", { name: "Sem conexao" })).toBeVisible();
      const cachedUrls = await page.evaluate(async () => {
        const keys = await caches.keys();
        const requests = await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()));
        return requests.flat().map((request) => request.url);
      });
      expect(cachedUrls.some((url) => new URL(url).pathname.startsWith("/app"))).toBe(false);
    } finally {
      await page.context().setOffline(false);
    }
  });
});

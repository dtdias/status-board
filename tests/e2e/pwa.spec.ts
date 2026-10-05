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

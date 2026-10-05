import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../app/manifest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const pngDimensions = (path: string) => {
  const bytes = readFileSync(resolve(root, path));
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

describe("PWA contract", () => {
  it("defines installable manifest metadata and icons", () => {
    const value = manifest();
    const icons = Array.isArray(value.icons) ? value.icons : [];

    expect(value).toMatchObject({
      id: "/app",
      start_url: "/app",
      scope: "/",
      display: "standalone",
      background_color: "#f4f2ed",
      theme_color: "#1c1c1c",
      lang: "pt-BR",
    });
    expect(icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" }),
      expect.objectContaining({ src: "/pwa/icon-maskable-512.png", purpose: "maskable" }),
    ]));
  });

  it.each([
    ["public/pwa/icon-192.png", 192],
    ["public/pwa/icon-512.png", 512],
    ["public/pwa/icon-maskable-512.png", 512],
    ["app/apple-icon.png", 180],
  ])("ships %s at %d pixels", (path, size) => {
    expect(existsSync(resolve(root, path))).toBe(true);
    expect(pngDimensions(path)).toEqual({ width: size, height: size });
  });

  it("registers worker only as progressive enhancement", () => {
    const registration = read("components/pwa/service-worker-registration.tsx");
    const networkStatus = read("components/pwa/network-status.tsx");

    expect(registration).toContain('process.env.NODE_ENV !== "production"');
    expect(registration).toContain('navigator.serviceWorker.register("/sw.js"');
    expect(registration).toContain('updateViaCache: "none"');
    expect(networkStatus).toContain("navigator.onLine");
    expect(networkStatus).toContain('role="status"');
  });

  it("keeps private responses out of worker cache", () => {
    const worker = read("public/sw.js");

    expect(worker).toContain('request.method !== "GET"');
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain('caches.match("/offline.html")');
    expect(worker).toContain("cache.addAll(PUBLIC_ASSETS)");
    expect(worker).not.toContain("cache.put(");
    for (const prefix of ["/app", "/api", "/auth", "/login", "/signup", "/reset-password"]) {
      expect(worker).toContain(`"${prefix}"`);
    }
  });

  it("sets PWA metadata, safe viewport and worker cache headers", () => {
    const layout = read("app/layout.tsx");
    const styles = read("app/globals.css");
    const nextConfig = read("next.config.ts");

    expect(layout).toContain('manifest: "/manifest.webmanifest"');
    expect(layout).toContain('viewportFit: "cover"');
    expect(layout).toContain('index: false');
    expect(styles).toContain("env(safe-area-inset-bottom)");
    expect(styles).toContain("100dvh");
    expect(nextConfig).toContain('source: "/sw.js"');
    expect(nextConfig).toContain("no-cache, no-store, must-revalidate");
    expect(nextConfig).toContain('Service-Worker-Allowed');
  });

  it("keeps offline fallback self-contained", () => {
    const offline = read("public/offline.html");

    expect(offline).toContain('lang="pt-BR"');
    expect(offline).toContain('viewport-fit=cover');
    expect(offline).toContain("location.reload()");
    expect(offline).not.toContain("http://");
    expect(offline).not.toContain("https://");
  });
});

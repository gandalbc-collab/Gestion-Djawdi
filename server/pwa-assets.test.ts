import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("PWA install assets", () => {
  it("declares a standalone French web app with an icon", async () => {
    const manifest = JSON.parse(await readFile("client/public/manifest.webmanifest", "utf8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("fr");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/manus-storage/djawdi-pwa-192_35a1cfcd.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/manus-storage/djawdi-pwa-512_7910eed9.png", sizes: "512x512" }),
    ]));
  });

  it("includes a navigation fallback for a basic offline app shell", async () => {
    const worker = await readFile("client/public/service-worker.js", "utf8");
    expect(worker).toContain('const CACHE_NAME = "djawdi-shell-v2"');
    expect(worker).toContain("caches.delete(key)");
    expect(worker).toContain("fetch(event.request)");
    expect(worker).toContain('caches.match("/")');
  });
});

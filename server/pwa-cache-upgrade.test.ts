import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("PWA cache upgrade", () => {
  it("purges the v1 shell and serves the current navigation response before falling back offline", async () => {
    const workerSource = await readFile("client/public/service-worker.js", "utf8");
    const handlers = new Map<string, (event: any) => void>();
    const cache = {
      addAll: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const caches = {
      keys: vi.fn().mockResolvedValue(["djawdi-shell-v1", "djawdi-shell-v2"]),
      delete: vi.fn().mockResolvedValue(true),
      open: vi.fn().mockResolvedValue(cache),
      match: vi.fn().mockResolvedValue(new Response("offline shell")),
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response("new release", { status: 200 }));
    const self = {
      addEventListener: (type: string, handler: (event: any) => void) => handlers.set(type, handler),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn().mockResolvedValue(undefined) },
    };

    vm.runInNewContext(workerSource, { self, caches, fetch: fetchMock, Promise, Response });

    let activation: Promise<void> | undefined;
    handlers.get("activate")?.({ waitUntil: (promise: Promise<void>) => { activation = promise; } });
    await activation;
    expect(caches.delete).toHaveBeenCalledWith("djawdi-shell-v1");
    expect(caches.delete).not.toHaveBeenCalledWith("djawdi-shell-v2");

    let navigation: Promise<Response> | undefined;
    handlers.get("fetch")?.({
      request: { method: "GET", mode: "navigate" },
      respondWith: (promise: Promise<Response>) => { navigation = promise; },
    });
    const response = await navigation;
    expect(await response?.text()).toBe("new release");
    expect(fetchMock).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(cache.put).toHaveBeenCalledWith("/", expect.any(Response));
  });
});

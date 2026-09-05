import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { applySecurityMiddleware } from "./_core/security";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close(error => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

describe("security middleware", () => {
  it("sets the baseline browser protection headers", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const app = express();
    applySecurityMiddleware(app);
    app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

    server = createServer(app);
    await new Promise<void>(resolve => server?.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/health`);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(response.headers.get("permissions-policy")).toContain("camera=()");
      expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
      const csp = response.headers.get("content-security-policy") ?? "";
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("https://identitytoolkit.googleapis.com");
      expect(csp).toContain("https://securetoken.googleapis.com");
      expect(csp).toContain("https://firestore.googleapis.com");
      expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
      expect(response.headers.get("x-powered-by")).toBeNull();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

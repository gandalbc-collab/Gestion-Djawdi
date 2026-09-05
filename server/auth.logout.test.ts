/**
 * auth.logout — Firebase Auth migration
 *
 * Firebase manages the client session. The server-side logout procedure
 * therefore remains a compatibility endpoint and simply
 * returns { success: true } as a compatibility shim for the useAuth() hook.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("returns { success: true } (Firebase manages session client-side)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });

  it("returns { success: true } even when called unauthenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

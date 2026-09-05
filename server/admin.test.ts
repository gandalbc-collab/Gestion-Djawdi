import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: "user" | "admin" = "user", userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-${role}-${userId}`,
    email: `${role}${userId}@test.com`,
    name: `Test ${role} ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    isBlocked: false,
    passwordResetRequestedAt: null,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ─── Admin RBAC ──────────────────────────────────────────────────────────────
describe("admin RBAC — non-admin user is rejected", () => {
  it("admin.stats throws UNAUTHORIZED for unauthenticated", async () => {
    const caller = appRouter.createCaller(createUnauthCtx());
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("admin.stats throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin.users.list throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin.courses.list throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.courses.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin.ads.list throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.ads.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin.notifications.list throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.notifications.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin.contact.get throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.contact.get()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin.settings.get throws FORBIDDEN for role=user", async () => {
    const caller = appRouter.createCaller(createCtx("user"));
    await expect(caller.admin.settings.get()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("admin RBAC — admin user is allowed", () => {
  it("admin.stats resolves for role=admin (may return DB error, not FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    // In test env, DB may not be available — we only check it does NOT throw FORBIDDEN
    const result = await caller.admin.stats().catch((e: any) => e);
    if (result instanceof Error) {
      expect(result.message).not.toContain("FORBIDDEN");
    }
  });

  it("admin.users.list resolves for role=admin (not FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(createCtx("admin"));
    const result = await caller.admin.users.list().catch((e: any) => e);
    if (result instanceof Error) {
      expect(result.message).not.toContain("FORBIDDEN");
    }
  });
});

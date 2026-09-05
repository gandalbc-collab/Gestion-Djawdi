import { describe, expect, it, beforeEach } from "vitest";
import { vi } from "vitest";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getPublishedCourses: vi.fn().mockResolvedValue([]),
    getLearningSettings: vi.fn().mockResolvedValue(null),
  };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("returns { success: true } (Firebase manages the client session)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });

  it("auth.me returns null when unauthenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

// ─── Input validation (Zod schemas) ──────────────────────────────────────────
describe("input validation", () => {
  it("revenues.add rejects negative amount", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.revenues.add({ description: "Test", amount: -100, month: "2026-07" })
    ).rejects.toThrow();
  });

  it("revenues.add rejects invalid month format", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.revenues.add({ description: "Test", amount: 1000, month: "07-2026" })
    ).rejects.toThrow();
  });

  it("expenses.add rejects empty description", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.expenses.add({ categoryId: 1, description: "", amount: 500, month: "2026-07" })
    ).rejects.toThrow();
  });

  it("budgets.upsert rejects negative amount", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.budgets.upsert({ categoryId: 1, amount: -50, month: "2026-07" })
    ).rejects.toThrow();
  });

  it("scheduledPayments.create rejects dayOfMonth > 31", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.scheduledPayments.create({
        categoryId: 1,
        description: "Test",
        amount: 1000,
        dayOfMonth: 32,
      })
    ).rejects.toThrow();
  });

  it("scheduledPayments.create rejects dayOfMonth = 0", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.scheduledPayments.create({
        categoryId: 1,
        description: "Test",
        amount: 1000,
        dayOfMonth: 0,
      })
    ).rejects.toThrow();
  });

  it("revenues.add rejects amount > 999_999_999", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.revenues.add({ description: "Test", amount: 1_000_000_000, month: "2026-07" })
    ).rejects.toThrow();
  });

  it("profile.update rejects unknown currency", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.profile.update({ fullName: "Test", currency: "JPY" as any })
    ).rejects.toThrow();
  });

  it("profile.update rejects empty fullName", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.profile.update({ fullName: "", currency: "GNF" })
    ).rejects.toThrow();
  });
});

// ─── Protected procedures ────────────────────────────────────────────────────
describe("protected procedures reject unauthenticated requests", () => {
  const unauthCtx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  it("revenues.list throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.revenues.list({ month: "2026-07" })).rejects.toThrow();
  });

  it("expenses.list throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.expenses.list({ month: "2026-07" })).rejects.toThrow();
  });

  it("budgets.list throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.budgets.list({ month: "2026-07" })).rejects.toThrow();
  });

  it("caisse.get throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.caisse.get()).rejects.toThrow();
  });

  it("synthesis.history throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.synthesis.history()).rejects.toThrow();
  });

  it("profile.get throws UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    await expect(caller.profile.get()).rejects.toThrow();
  });
});

// ─── Learning module — RBAC ───────────────────────────────────────────────────
describe("learning module RBAC", () => {
  const unauthCtx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };

  it("learning.list is public (no auth required)", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    const result = await caller.learning.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("learning.settings is public (no auth required)", async () => {
    const caller = appRouter.createCaller(unauthCtx);
    const result = await caller.learning.settings();
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("learning.listAll throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("learning.create throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.learning.create({ title: "Test", slug: "test-slug", content: "Hello" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("learning.delete throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("learning.updateSettings throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.learning.updateSettings({ showYoutubeButton: false })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("learning.approveComment throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.approveComment({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("learning.deleteComment throws FORBIDDEN for regular user", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.deleteComment({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("learning.rate rejects rating > 5", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.rate({ courseId: 1, rating: 6 })).rejects.toThrow();
  });

  it("learning.rate rejects rating < 1", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.rate({ courseId: 1, rating: 0 })).rejects.toThrow();
  });

  it("learning.comment rejects empty content", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(caller.learning.comment({ courseId: 1, content: "" })).rejects.toThrow();
  });

  it("learning.comment rejects content > 1000 chars", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.learning.comment({ courseId: 1, content: "x".repeat(1001) })
    ).rejects.toThrow();
  });
});

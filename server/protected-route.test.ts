import { describe, expect, it } from "vitest";
import { getProtectedRouteRedirect } from "../client/src/lib/authRoute";

describe("protected route redirect", () => {
  it("waits for authentication hydration before redirecting and sends visitors to login", () => {
    expect(getProtectedRouteRedirect(true, false)).toBeNull();
    expect(getProtectedRouteRedirect(false, false)).toBe("/login");
    expect(getProtectedRouteRedirect(false, true)).toBeNull();
  });
});

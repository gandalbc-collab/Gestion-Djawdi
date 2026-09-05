import { describe, expect, it } from "vitest";
import { hasVerifiedEmail } from "./_core/context";
import { getProtectedRouteRedirect } from "../client/src/lib/authRoute";

describe("Firebase login to dashboard flow", () => {
  it("keeps a user with a verified Firebase identity on the protected dashboard", () => {
    const verifiedIdentity = {
      uid: "firebase-user-id",
      email: "user@example.com",
      email_verified: true,
    };

    expect(hasVerifiedEmail(verifiedIdentity)).toBe(true);
    expect(getProtectedRouteRedirect(false, true)).toBeNull();
  });

  it("prevents an unverified or absent identity from accessing the dashboard", () => {
    expect(hasVerifiedEmail({ email: "user@example.com", email_verified: false })).toBe(false);
    expect(getProtectedRouteRedirect(false, false)).toBe("/login");
  });
});

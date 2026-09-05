import { describe, expect, it } from "vitest";
import { hasVerifiedEmail } from "./_core/context";

describe("Firebase e-mail verification", () => {
  it("accepts only tokens with a verified non-empty e-mail address", () => {
    expect(hasVerifiedEmail({ email: "utilisateur@example.com", email_verified: true })).toBe(true);
    expect(hasVerifiedEmail({ email: "utilisateur@example.com", email_verified: false })).toBe(false);
    expect(hasVerifiedEmail({ email_verified: true })).toBe(false);
    expect(hasVerifiedEmail({ email: "", email_verified: true })).toBe(false);
  });
});

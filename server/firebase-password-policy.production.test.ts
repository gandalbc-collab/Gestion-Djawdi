import { describe, expect, it } from "vitest";

describe("Firebase Identity Platform password policy in production", () => {
  it("rejects each password that violates a configured requirement through the public Authentication API", async () => {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    expect(apiKey).toBeTruthy();

    const invalidPasswords = [
      "Abcdef1!ghi", // 11 characters: lower than the configured minimum of 12
      "abcdef1!ghij", // missing uppercase
      "ABCDEF1!GHIJ", // missing lowercase
      "Abcdef!Ghijk", // missing numeric
      "Abcdef1Ghijk", // missing special character
      `${"Aa1!".repeat(32)}A`, // 129 characters: greater than the configured maximum of 128
    ];

    for (const [index, password] of invalidPasswords.entries()) {
      const email = `policy-check-${Date.now()}-${index}@example.com`;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey!)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const result = (await response.json()) as { error?: { message?: string } };

      expect(response.status).toBe(400);
      expect(result.error?.message).toMatch(
        /WEAK_PASSWORD|PASSWORD.*REQUIREMENT|INVALID_PASSWORD|PASSWORD.*LONG|TOO_LONG/i
      );
    }
  });
});

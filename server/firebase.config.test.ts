import { describe, expect, it } from "vitest";

describe("Firebase public configuration", () => {
  it("accepts the configured web API key on Firebase Authentication without creating a user", async () => {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

    expect(apiKey).toBeTruthy();
    expect(projectId).toBe("gestion-djawdi");

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey!)}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    );
    const result = await response.json() as { error?: { message?: string } };

    // A deliberately empty request must be rejected for missing credentials,
    // not because the configured API key or Firebase project is invalid.
    expect(response.status).toBe(400);
    expect(result.error?.message).not.toMatch(/API_KEY_INVALID|PROJECT_NOT_FOUND|SERVICE_DISABLED/);
  });
});

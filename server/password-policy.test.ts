import { describe, expect, it } from "vitest";
import { isStrongPassword } from "../client/src/lib/passwordPolicy";

describe("password policy", () => {
  it("requires at least 12 characters including all four character groups", () => {
    expect(isStrongPassword("Abcdef1!ghij")).toBe(true);
    expect(isStrongPassword("Abcdef1!ghi")).toBe(false);
    expect(isStrongPassword("abcdefghijkl!")).toBe(false);
    expect(isStrongPassword("ABCDEFGHIJKL1!")).toBe(false);
    expect(isStrongPassword("Abcdefghijkl!")).toBe(false);
    expect(isStrongPassword("Abcdefghijkl1")).toBe(false);
  });
});

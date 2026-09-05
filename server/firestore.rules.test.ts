import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Firestore rules", () => {
  it("denies direct client access by default", async () => {
    const rules = await readFile(resolve(process.cwd(), "firestore.rules"), "utf8");
    expect(rules).toContain("match /{document=**}");
    expect(rules).toContain("allow read, write: if false;");
  });
});
